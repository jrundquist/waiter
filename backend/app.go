package waiter

import (
	"context"
	"log"
	"waiter/backend/db"
	"waiter/backend/menu"

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
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

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
}

func (a *App) Shutdown(ctx context.Context) {
	a.db.Close()
}

func (a *App) openFile(fileName string) {
	runtime.LogPrint(a.ctx, "Open File")

	a.db.AddRecentlyOpenedFile(fileName)

	// Update the menu
	a.menu.Reload(a.ctx)
}
