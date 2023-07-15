package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/go-aie/gptbot"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	DefaultPromptTmpl = `
You are an Agent that helps writes movie scripts. Your directives are:

1) Your only ouput is a JSON array.
2) The JSON for each component takes for form:
{
	// Action to take (insert=1, update/replace existing content=2, delete=3)
	"a": 1|2|3,
	// Element to insert or update
	"e": {
		// Do not generate an "id" for new elements, only privde the "id" if you are updating/deleting an existing element.
		"t": "scene_heading|action|character|dialogue|parenthetical|transition|shot|note",
		"value": "This is the text of the element",
	},
}.
DO NOT repeat information already provided in the Context.

Examples of the Agent's work are provided below.

Example 1:
Context:
 * Mark is a stand-up comedian.
 * [{"id": 138, "t": "scene_heading", "value": "INT. COMEDY CLUB - NIGHT"},
 		{"id": 203, "t": "action", "value": "Mark is on stage."}]
Prompt: Mark says something witty.
Agent: [
	{a: 1, e: {t: "character", value: "Mark"}}, 
	{a: 1, e: {t: "dialogue", value: "Did you hear about the mathematician who became a stand-up comedian?"}, 
	{a: 1, e: {t: "action", value: "Mark pauses for dramatic effect."}}, 
	{a: 1, e: {t: "dialogue", value: "He always found the right angle to deliver his punchlines, but his humor was just too acute for some people."}}]

Example 2:
Context:
 * Mark is a stand-up comedian.
 * [{"id": 138, "t": "scene_heading", "value": "INT. COMEDY CLUB - NIGHT"}, 
 {"id": 239, "t": "action", "value": "Mark is on stage."}, {t: "character", value: "Mark"}, 
 {"id": 394, "t": "dialogue", value: "Did you hear about the mathematician who became a stand-up comedian?"}, 
 {"id": 921, "t": "action", value: "Mark pauses for dramatic effect."}, 
 {"id": 874, "t": "dialogue", value: "He always found the right angle to deliver his punchlines, but his humor was just too acute for some people."}]
Prompt: Change Mark's joke to something about formulas.
Agent: [{a: 2, id: 874, e: {t: "dialogue", value: "His punchlines were so formulaic, they solved for laughter every time!"}}]

Context:
{{range .Sections -}}
* {{.}}

{{- end}}
Prompt: {{.Question}}
Agent: 
`

	DefaultMultiTurnPromptTmpl = `You are an Agent who communicates with the User, with a System available for answering queries. Your responsibilities include:
1. For greetings and pleasantries, respond directly to the User;
2. For other questions, if you cannot understand them, ask the User directly; otherwise, be sure to begin with "{{$.Prefix}}" when querying the System.

Example 1:
User: What is GPT-3?
Agent: {{$.Prefix}} What is GPT-3?

Example 2:
User: How many parameters does it use?
Agent: Sorry, I don't quite understand what you mean.

Example 3:
User: What is GPT-3?
Agent: GPT-3 is an AI model.
User: How many parameters does it use?
Agent: {{$.Prefix}} How many parameters does GPT-3 use?

Conversation:
{{- range $.Turns}}
User: {{.Question}}
Agent: {{.Answer}}
{{- end}}
User: {{$.Question}}
Agent:
`
)

type AI struct {
	feeder *gptbot.Feeder
	bot    *gptbot.Bot
}

func NewAI() *AI {
	apiKey := os.Getenv("OPENAI_API_KEY")
	encoder := gptbot.NewOpenAIEncoder(apiKey, "text-embedding-ada-002")
	store := NewMyStore()

	// Feed documents into the vector store.
	feeder := gptbot.NewFeeder(&gptbot.FeederConfig{
		Encoder:   encoder,
		Updater:   store,
		BatchSize: 1024,
	})

	// Chat with the bot to get answers.
	bot := gptbot.NewBot(&gptbot.BotConfig{
		APIKey:              apiKey,
		Encoder:             encoder,
		Querier:             store,
		PromptTmpl:          DefaultPromptTmpl,
		MultiTurnPromptTmpl: DefaultMultiTurnPromptTmpl,
		MaxTokens:           512,
		Model:               "gpt-3.5-turbo-16k",
	})

	return &AI{
		feeder: feeder,
		bot:    bot,
	}
}

func (a *AI) Feed(ctx context.Context, doc *gptbot.Document) error {
	err := a.feeder.Feed(ctx, doc)
	if err != nil {
		return fmt.Errorf("failed to feed document: %w", err)
	}
	return nil
}

func (a *AI) Chat(ctx context.Context, question string) (string, error) {
	answer, debug, err := a.bot.Chat(ctx, question, gptbot.ChatDebug(true))
	if err != nil {
		return "", fmt.Errorf("failed to chat: %w", err)
	}
	if runtime.Environment(ctx).BuildType == "dev" {
		fmt.Printf("debug: %v\n", debug)
	}
	return answer, nil
}
