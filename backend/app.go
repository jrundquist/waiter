package waiter

import (
	"context"
	"fmt"
	"log"
	"waiter/backend/ai"
	"waiter/backend/db"
	"waiter/backend/menu"

	"github.com/go-aie/gptbot"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type File struct {
	Filename string `json:"filename" binding:"required"`
	Contents string `json:"contents" binding:"required"`
}

var ()

// App struct
type App struct {
	ctx context.Context

	Middleware *MiddlewareFunctions

	db   *db.Database
	menu *menu.Menu
	ai   *ai.AI
}

// NewApp creates a new App application struct
func NewApp() *App {
	db, err := db.NewDatabase()
	if err != nil {
		log.Fatal(err)
	}

	appMenu := menu.NewMenu(db)

	return &App{
		Middleware: &MiddlewareFunctions{
			ctx: nil,
		},
		db:   db,
		menu: appMenu,
		ai:   ai.NewAI(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	a.startAI(ctx)

	// Bind the middleware functions
	a.menu.Reload(ctx)

	// Set the context for the middleware functions
	a.Middleware.setContext(ctx)

	// Listen for events
	runtime.EventsOn(ctx, "file:new", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~New~~~~")
	})

	runtime.EventsOn(ctx, "file:openDialog", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Open Dialog~~~~")
		fileName, err := runtime.OpenFileDialog(ctx, runtime.OpenDialogOptions{
			Title: "Open Script",
			Filters: []runtime.FileFilter{
				{
					DisplayName: "wAIter Script",
					Pattern:     "*.wai",
				},
				{
					DisplayName: "Final Draft Script",
					Pattern:     "*.fdx",
				},
			},
		})
		if err != nil {
			runtime.LogError(ctx, err.Error())
			return
		}
		if fileName == "" {
			return
		}
		a.openFile(fileName)
	})

	runtime.EventsOn(ctx, "file:openFile", func(data ...interface{}) {
		runtime.LogPrint(ctx, "~~~Open File~~~~")
		a.openFile(data[0].(string))
		a.menu.Reload(ctx)
	})

	runtime.EventsOn(ctx, "file:clearRecent", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Clear Recent~~~~")
		a.db.ClearRecentlyOpenedFiles()
		a.menu.Reload(ctx)
	})

	runtime.EventsOn(ctx, "file:save", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Save~~~~")
	})

	runtime.EventsOn(ctx, "file:saveAs", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Save As~~~~")
	})

	runtime.EventsOn(ctx, "file:close", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Close~~~~")
	})

	runtime.EventsOn(ctx, "ai:prompt", func(_ ...interface{}) {
		runtime.LogPrint(ctx, "~~~Prompt~~~~")
		out, err := a.ai.Chat(ctx, "Write the next couple of lines of dialog incorporating a joke.")
		if err != nil {
			fmt.Printf("err: %v", err)
			return
		}
		fmt.Printf("out: %v", out)
	})
}

func (a *App) Shutdown(ctx context.Context) {
	a.db.Close()
}

func (a *App) startAI(ctx context.Context) {
	if err := a.ai.Feed(ctx, &gptbot.Document{
		ID: "1",
		Text: `[
			{ "id": 0, "t": "scene_heading", "value": "INT. GROCERY STORE - DAY"},
			{ "id": 1, "t": "action", "value": "Chad and Charles are in the grocery store debating what to get for dinner."},
			{ "id": 2, "t": "character", "value": "Chad"},
			{ "id": 3, "t": "dialogue", "value": "Okay, Charles, we've been standing here for ages. We need to make a decision on what to get for dinner"},
			{ "id": 4, "t": "character", "value": "Charles"},
			{ "id": 5, "t": "dialogue", "value": "I know, Chad, but there are so many options. I can't decide between chicken or fish"},
			{ "id": 6, "t": "character", "value": "Chad"},
			{ "id": 7, "t": "parenthetical", "value": "thinking for a moment, looking at the endless options"}
			{ "id": 8, "t": "dialogue", "value": "Well, how about we compromise and go for both? We could make a delicious surf and turf meal."},
			{ "id": 9, "t": "action" "value": "Chad picks up a potato and examines it."},
			]`,
	}); err != nil {
		fmt.Printf("err: %v", err)
		return
	}
	if err := a.ai.Feed(ctx, &gptbot.Document{
		ID:   "2",
		Text: "In this lighthearted comedy skit, Charles and Chad find themselves in a comical dilemma while trying to decide what to make for dinner. The skit unfolds with a series of hilarious miscommunications and contrasting culinary preferences between the two characters. Charles, a health-conscious individual, suggests a nutritious salad, while Chad, the epitome of indulgence, insists on ordering pizza. As they debate their choices, their exaggerated reactions and witty banter highlight the stark differences in their personalities and comedic timing. Eventually, they reach a humorous compromise that leads to an unexpected and amusing twist, leaving the audience laughing and eagerly anticipating what comes next.",
	}); err != nil {
		fmt.Printf("err: %v", err)
		return
	}
}

func (a *App) openFile(fileName string) {
	runtime.LogPrint(a.ctx, "Open File")

	a.db.AddRecentlyOpenedFile(fileName)

	// Update the menu
	a.menu.Reload(a.ctx)
}
