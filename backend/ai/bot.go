package ai

import (
	"bytes"
	"context"
	"text/template"

	"github.com/go-aie/gptbot"
)

var (
	promptTmpl = `
Answer the question as truthfully as possible using the provided context, and if the answer is not contained within the text below, say "I don't know."

Context:

{{range .Sections -}}
* {{.}}
{{- end}}

Q: {{.Question}}
A:
`
)

// Turn represents a round of dialogue.
type Turn struct {
	Question string `json:"question,omitempty"`
	Answer   string `json:"answer,omitempty"`
}

type BotConfig struct {
	// APIKey is the LLM Platform's APIKey.
	// This field is required.
	APIKey string

	// Engine is the LLM Platform api implementation
	// Defaults to OpenAI's chat api which using gpt-3.5-turbo model
	Engine gptbot.Engine

	// Encoder is an Embedding Encoder, which will encode the user's question into a vector for similarity search.
	// This field is required.
	Encoder gptbot.Encoder

	// Querier is a search engine, which is capable of doing the similarity search.
	// This field is required.
	Querier gptbot.Querier

	// Model is the ID of OpenAI's model to use for chat.
	// Defaults to "gpt-3.5-turbo".
	Model gptbot.ModelType

	// TopK specifies how many candidate similarities will be selected to construct the prompt.
	// Defaults to 3.
	TopK int

	// Temperature specifies the sampling temperature to use, between 0 and 1.
	// Higher values like 0.8 will make the output more random, while lower values
	// like 0.2 will make it more focused and deterministic. Defaults to 0.7.
	//
	// Note that in multi-turn mode, Temperature only applies to the backend
	// system, and the temperature of the frontend agent is always 0 since we
	// want its behaviour to be as deterministic as possible.
	Temperature float64

	// MaxTokens is the maximum number of tokens to generate in the chat.
	// Defaults to 256.
	MaxTokens int
}

func (cfg *BotConfig) init() {
	// Check required fields and assign defaults
}

type Embedding []float64

type Encoder interface {
	Encode(cxt context.Context, text string) (Embedding, error)
	EncodeBatch(cxt context.Context, texts []string) ([]Embedding, error)
}

type Querier interface {
	Query(ctx context.Context, embedding Embedding, corpusID string, topK int) ([]*gptbot.Similarity, error)
}

type Bot struct {
	cfg *BotConfig
}

// NewBot support single and multi-turn chat request
func NewBot(cfg *BotConfig) *Bot {
	cfg.init()
	bot := &Bot{cfg: cfg}

	return bot
}

func (b *Bot) FillInTheMiddle(ctx context.Context, scenePrefix string, sceneSuffix string, options ...ChatOption) (answer string, debug *Debug, err error) {
	opts := new(chatOptions)
	for _, option := range options {
		option(opts)
	}

	if opts.Debug {
		debug = new(Debug)
		ctx = newContext(ctx, debug)
	}
	// DO CHAT
	return
}

func (b *Bot) chat(ctx context.Context, prompt string, temperature float64) (string, error) {
	req := &gptbot.EngineRequest{
		Messages:    []*gptbot.EngineMessage{{Role: "user", Content: prompt}},
		Temperature: temperature,
		MaxTokens:   b.cfg.MaxTokens,
	}
	resp, err := b.cfg.Engine.Infer(ctx, req)
	if err != nil {
		return "", err
	}

	return resp.Text, nil
}

func (b *BotConfig) constructPrompt(ctx context.Context, question string, opts *chatOptions) (string, error) {
	emb, err := b.Encoder.Encode(ctx, question)
	if err != nil {
		return "", err
	}

	similarities, err := b.Querier.Query(ctx, emb, opts.CorpusID, b.TopK)
	if err != nil {
		return "", err
	}

	var texts []string
	for _, s := range similarities {
		texts = append(texts, s.Text)
	}

	p := PromptTemplate(promptTmpl)
	return p.Render(PromptData{
		Question: question,
		Sections: texts,
	})
}

type chatOptions struct {
	Debug    bool
	CorpusID string
	History  []*Turn
}

type ChatOption func(opts *chatOptions)

func ChatDebug(debug bool) ChatOption {
	return func(opts *chatOptions) { opts.Debug = debug }
}

func ChatHistory(history ...*Turn) ChatOption {
	return func(opts *chatOptions) { opts.History = history }
}

func ChatCorpusID(corpusID string) ChatOption {
	return func(opts *chatOptions) { opts.CorpusID = corpusID }
}

type PromptData struct {
	Question string
	Sections []string
}

type PromptTemplate string

func (p PromptTemplate) Render(data any) (string, error) {
	tmpl, err := template.New("").Parse(string(p))
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

type Debug struct {
	FrontendReply string `json:"frontend_reply,omitempty"`
	BackendPrompt string `json:"backend_prompt,omitempty"`
}

type contextKeyT string

var contextKey = contextKeyT("jrundquist.waiter.debug")

// NewContext returns a copy of the parent context
// and associates it with a Debug.
func newContext(ctx context.Context, d *Debug) context.Context {
	return context.WithValue(ctx, contextKey, d)
}

// FromContext returns the Debug bound to the context, if any.
func fromContext(ctx context.Context) (d *Debug, ok bool) {
	d, ok = ctx.Value(contextKey).(*Debug)
	return
}
