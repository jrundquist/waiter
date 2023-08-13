package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/go-aie/gptbot"
	"github.com/pkoukk/tiktoken-go"
	tiktoken_loader "github.com/pkoukk/tiktoken-go-loader"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type AI struct {
	feeder *gptbot.Feeder
	bot    *Bot
	store  *MyStore
}

func NewAI() *AI {
	apiKey := os.Getenv("OPENAI_API_KEY")
	encoderModel := "text-embedding-ada-002"
	encoder := gptbot.NewOpenAIEncoder(apiKey, encoderModel)
	encoderMaxTokens := 8191
	store := NewMyStore()

	tiktoken.SetBpeLoader(tiktoken_loader.NewOfflineLoader())
	tokenizer, err := tiktoken.EncodingForModel(encoderModel)
	if err != nil {
		err = fmt.Errorf("getEncoding: %v", err)
		panic(err)
	}

	token := tokenizer.Encode("Hello, world!", nil, nil)
	fmt.Printf("token: %v\n", token)
	fmt.Printf("count: %v\n", len(token))

	// Feed documents into the vector store.
	feeder := gptbot.NewFeeder(&gptbot.FeederConfig{
		Encoder:   encoder,
		Updater:   store,
		BatchSize: 1024,
		Preprocessor: gptbot.NewPreprocessor(&gptbot.PreprocessorConfig{
			// Split documents into chunks of 2000 tokens.
			// The current encoder has a max token length of 8191.
			ChunkTokenNum: int(encoderMaxTokens / 2),
		}),
	})

	// Chat with the bot to get answers.
	bot := NewBot(&BotConfig{
		APIKey:    apiKey,
		Encoder:   encoder,
		Querier:   store,
		MaxTokens: 1024,
		Model:     gptbot.GPT3Dot5Turbo16K,
	})

	return &AI{
		feeder: feeder,
		bot:    bot,
		store:  store,
	}
}

func (a *AI) Init(ctx context.Context) {
	a.store.Load(ctx)
}

func (a *AI) UpdateSceneContent(ctx context.Context, sceneMap map[string]string) {
	if err := a.store.Clear(ctx); err != nil {
		runtime.LogErrorf(ctx, "failed to clear store: %v", err)
	}
	for scene, content := range sceneMap {
		a.feeder.Feed(context.Background(), &gptbot.Document{
			ID: scene,
			// Concat the scene heading and action.
			Text: content,
		})
	}
}

func (a *AI) FillInTheMiddle(ctx context.Context, prefix string, suffix string) (string, error) {
	answer, debug, err := a.bot.FillInTheMiddle(ctx, prefix, suffix)
	if err != nil {
		return "", fmt.Errorf("failed to chat: %w", err)
	}
	if runtime.Environment(ctx).BuildType == "dev" {
		fmt.Printf("debug: %v\n", debug)
	}
	return answer, nil
}

func (a *AI) Close() error {
	if err := a.store.Save(); err != nil {
		return fmt.Errorf("failed to save store: %w", err)
	}
	return nil
}
