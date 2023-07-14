package waiter

import (
	"context"
	"fmt"
	"path"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type File struct {
	Filename string `json:"filename" binding:"required"`
	Contents string `json:"contents" binding:"required"`
}

var (
	recentOpens = []string{}
)

// App struct
type App struct {
	ctx context.Context

	Middleware *MiddlewareFunctions
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		Middleware: &MiddlewareFunctions{
			ctx: nil,
		},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Bind the middleware functions
	runtime.MenuSetApplicationMenu(ctx, a.createMenu())

	a.Middleware.setContext(ctx)
}

func (a *App) openFile(fileName string) {
	runtime.LogPrint(a.ctx, "Open File")

	// Check to see if recentOpens already contains the file
	for i, recentOpen := range recentOpens {
		if recentOpen == fileName {
			// Remove the file from the list
			recentOpens = append(recentOpens[:i], recentOpens[i+1:]...)
			break
		}
	}
	recentOpens = append(recentOpens, fileName)
	// Update the menu
	runtime.MenuSetApplicationMenu(a.ctx, a.createMenu())
	runtime.MenuUpdateApplicationMenu(a.ctx)
}

func (a *App) createMenu() *menu.Menu {
	appMenu := menu.NewMenu()
	waiterMenu := appMenu.AddSubmenu(AppName)
	aboutString := fmt.Sprintf("%s is a tool for managing waitlists.\n\nCreated by: James Rundquist\n\nVersion: %s", AppName, Version)
	waiterMenu.AddText(fmt.Sprintf("About %s", AppName), nil, func(_ *menu.CallbackData) {
		res, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Type:          runtime.InfoDialog,
			Title:         fmt.Sprintf("About %s", AppName),
			Message:       aboutString,
			Buttons:       []string{"Copy", "OK"},
			DefaultButton: "Copy",
			CancelButton:  "OK",
		})
		if err != nil {
			runtime.LogError(a.ctx, err.Error())
		}
		if res == "Copy" {
			runtime.ClipboardSetText(a.ctx, aboutString)
		}
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Preferences")
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText(fmt.Sprintf("Hide %s", AppName), keys.CmdOrCtrl("H"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Hide wAIter")
		runtime.Hide(a.ctx)
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText(fmt.Sprintf("Quit %s", AppName), keys.CmdOrCtrl("Q"), func(_ *menu.CallbackData) {
		runtime.Quit(a.ctx)
	})

	appMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Preferences")
	})

	fileMenu := appMenu.AddSubmenu("File")

	fileMenu.AddText("New", keys.CmdOrCtrl("n"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "New")
		runtime.EventsEmit(a.ctx, "file:new")
	})

	fileMenu.AddText("Open...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Open")
		fileName, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
			Title: "Open File",
			Filters: []runtime.FileFilter{
				{DisplayName: "Markdown", Pattern: "md"},
				{DisplayName: "Text", Pattern: "txt"},
			},
		})
		if err != nil {
			runtime.LogErrorf(a.ctx, "Error selecting file: %s", err.Error())
			return
		}
		a.openFile(fileName)
	})
	recent := fileMenu.AddSubmenu("Open Recent")
	displayed := make(map[string]interface{})
	for _, recentOpen := range recentOpens {
		display := path.Base(recentOpen)
		if _, ok := displayed[display]; ok {
			display = path.Join(path.Base(path.Dir(recentOpen)), path.Base(recentOpen))
		}
		displayed[display] = struct{}{}
		runtime.LogPrintf(a.ctx, "Adding recent open: %s => %s", display, recentOpen)
		recent.AddText(display, nil, func(_ *menu.CallbackData) {
			a.openFile(recentOpen)
		})
	}
	recent.AddSeparator()
	recent.AddText("Clear Menu", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Clear Menu")
		runtime.EventsEmit(a.ctx, "file:clearRecent")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Close", keys.CmdOrCtrl("w"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Close")
		runtime.EventsEmit(a.ctx, "file:close")
	})
	fileMenu.AddText("Save", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Save")
		runtime.EventsEmit(a.ctx, "file:save")
	})
	fileMenu.AddText("Save As...", keys.Combo("s", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Save As")
		runtime.EventsEmit(a.ctx, "file:saveAs")
	})
	fileMenu.AddCheckbox("Autosave", false, nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Auto Save")
		runtime.EventsEmit(a.ctx, "file:autoSave")
	})
	fileMenu.AddSeparator()
	importMenu := fileMenu.AddSubmenu("Import")
	importMenu.AddText("PDF", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Import PDF")
		runtime.EventsEmit(a.ctx, "file:importPDF")
	})
	importMenu.AddText("Final Draft", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Import Final Draft")
		runtime.EventsEmit(a.ctx, "file:importFinalDraft")
	})

	fileMenu.AddSeparator()
	exportMenu := fileMenu.AddSubmenu("Export")
	exportMenu.AddText("PDF", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Export PDF")
		runtime.EventsEmit(a.ctx, "file:exportPDF")
	})
	exportMenu.AddText("Final Draft", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Export Final Draft")
		runtime.EventsEmit(a.ctx, "file:exportFinalDraft")
	})
	exportMenu.AddText("Markdown", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Export Markdown")
		runtime.EventsEmit(a.ctx, "file:exportMarkdown")
	})

	formatMenu := appMenu.AddSubmenu("Format")
	formatMenu.AddText("Bold", keys.CmdOrCtrl("b"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Bold")
		runtime.EventsEmit(a.ctx, "format:bold")
	})
	formatMenu.AddText("Italic", keys.CmdOrCtrl("i"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Italic")
		runtime.EventsEmit(a.ctx, "format:italic")
	})
	formatMenu.AddText("Underline", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Underline")
		runtime.EventsEmit(a.ctx, "format:underline")
	})
	formatMenu.AddSeparator()
	formatMenu.AddText("Scene Heading", keys.Combo("H", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Scene Heading")
		runtime.EventsEmit(a.ctx, "format:sceneHeading")
	})
	formatMenu.AddText("Action", keys.Combo("a", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Action")
		runtime.EventsEmit(a.ctx, "format:action")
	})
	formatMenu.AddText("Character", keys.Combo("c", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Character")
		runtime.EventsEmit(a.ctx, "format:character")
	})
	formatMenu.AddText("Dialogue", keys.Combo("d", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Dialogue")
		runtime.EventsEmit(a.ctx, "format:dialogue")
	})
	formatMenu.AddText("Parenthetical", keys.Combo("p", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Parenthetical")
		runtime.EventsEmit(a.ctx, "format:parenthetical")
	})
	formatMenu.AddText("Transition", keys.Combo("t", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Transition")
		runtime.EventsEmit(a.ctx, "format:transition")
	})
	formatMenu.AddText("Shot", keys.Combo("s", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Shot")
		runtime.EventsEmit(a.ctx, "format:shot")
	})
	formatMenu.AddSeparator()
	formatMenu.AddText("Note", keys.CmdOrCtrl("m"), func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Note")
		runtime.EventsEmit(a.ctx, "format:note")
	})

	// if runtime.Environment(a.ctx).Platform == "darwin" {
	// appMenu.Append(menu.AppMenu())  // on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	appMenu.Append(menu.EditMenu()) // on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	// }

	appMenu.Append(menu.WindowMenu())

	helpMenu := appMenu.AddSubmenu("Help")
	helpMenu.AddText(fmt.Sprintf("%s Help", AppName), nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "Help")
	})
	helpMenu.AddSeparator()
	helpMenu.AddText(fmt.Sprintf("About %s", AppName), nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(a.ctx, "About")
	})

	return appMenu
}
