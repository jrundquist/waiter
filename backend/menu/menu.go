package menu

import (
	"context"
	"fmt"
	"path"
	"waiter/backend/consts"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type database interface {
	GetRecentlyOpenedFiles() ([]string, error)
}

type Menu struct {
	db database
}

func NewMenu(db database) *Menu {
	return &Menu{
		db: db,
	}
}

// Reload reloads the application menu
func (m *Menu) Reload(ctx context.Context) {
	runtime.MenuSetApplicationMenu(ctx, m.Generate(ctx))
	runtime.MenuUpdateApplicationMenu(ctx)
}

// CreateMenu creates the application menu
func (m *Menu) Generate(ctx context.Context) *menu.Menu {
	appMenu := menu.NewMenu()
	waiterMenu := appMenu.AddSubmenu(consts.AppName)
	aboutString := fmt.Sprintf("%s is a tool for managing waitlists.\n\nCreated by: James Rundquist\n\nVersion: %s", consts.AppName, consts.Version)
	waiterMenu.AddText(fmt.Sprintf("About %s", consts.AppName), nil, func(_ *menu.CallbackData) {
		res, err := runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:          runtime.InfoDialog,
			Title:         fmt.Sprintf("About %s", consts.AppName),
			Message:       aboutString,
			Buttons:       []string{"Copy", "OK"},
			DefaultButton: "Copy",
			CancelButton:  "OK",
		})
		if err != nil {
			runtime.LogError(ctx, err.Error())
		}
		if res == "Copy" {
			runtime.ClipboardSetText(ctx, aboutString)
		}
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Preferences")
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText(fmt.Sprintf("Hide %s", consts.AppName), keys.CmdOrCtrl("H"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Hide wAIter")
		runtime.Hide(ctx)
	})
	waiterMenu.AddSeparator()
	waiterMenu.AddText(fmt.Sprintf("Quit %s", consts.AppName), keys.CmdOrCtrl("Q"), func(_ *menu.CallbackData) {
		runtime.Quit(ctx)
	})

	appMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Preferences")
	})

	fileMenu := appMenu.AddSubmenu("File")

	fileMenu.AddText("New", keys.CmdOrCtrl("n"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "New")
		runtime.EventsEmit(ctx, "file:new")
	})

	fileMenu.AddText("Open...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Open")
		runtime.EventsEmit(ctx, "file:openDialog")
	})
	recent := fileMenu.AddSubmenu("Open Recent")
	displayed := make(map[string]interface{})
	recentOpens, err := m.db.GetRecentlyOpenedFiles()
	if err != nil {
		runtime.LogErrorf(ctx, "Error getting recently opened files: %s", err.Error())
	}

	for _, recentOpen := range recentOpens {
		display := path.Base(recentOpen)
		if _, ok := displayed[display]; ok {
			display = path.Join(path.Base(path.Dir(recentOpen)), path.Base(recentOpen))
		}
		displayed[display] = struct{}{}
		recent.AddText(display, nil, func(_ *menu.CallbackData) {
			runtime.EventsEmit(ctx, "file:openFile", recentOpen)
		})
	}
	recent.AddSeparator()
	recent.AddText("Clear Menu", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Clear Menu")
		runtime.EventsEmit(ctx, "file:clearRecent")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Close", keys.CmdOrCtrl("w"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Close")
		runtime.EventsEmit(ctx, "file:close")
	})

	canSave := false

	fileMenu.AddText("Save", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Save")
		runtime.EventsEmit(ctx, "file:save")
	})
	if !canSave {
		fileMenu.Items[len(fileMenu.Items)-1].Disabled = true
		fileMenu.Items[len(fileMenu.Items)-1].Accelerator = nil
	}
	fileMenu.AddText("Save As...", keys.Combo("s", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Save As")
		runtime.EventsEmit(ctx, "file:saveAs")
	})
	if !canSave {
		fileMenu.Items[len(fileMenu.Items)-1].Accelerator = keys.CmdOrCtrl("s")
	}
	fileMenu.AddCheckbox("Autosave", false, nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Auto Save")
		runtime.EventsEmit(ctx, "file:autoSave")
	})
	fileMenu.AddSeparator()
	importMenu := fileMenu.AddSubmenu("Import")
	importMenu.AddText("PDF", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Import PDF")
		runtime.EventsEmit(ctx, "file:importPDF")
	})
	importMenu.AddText("Final Draft", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Import Final Draft")
		runtime.EventsEmit(ctx, "file:importFinalDraft")
	})

	fileMenu.AddSeparator()
	exportMenu := fileMenu.AddSubmenu("Export")
	exportMenu.AddText("PDF", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Export PDF")
		runtime.EventsEmit(ctx, "file:exportPDF")
	})
	exportMenu.AddText("Final Draft", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Export Final Draft")
		runtime.EventsEmit(ctx, "file:exportFinalDraft")
	})
	exportMenu.AddText("Markdown", nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Export Markdown")
		runtime.EventsEmit(ctx, "file:exportMarkdown")
	})

	formatMenu := appMenu.AddSubmenu("Format")
	formatMenu.AddText("Bold", keys.CmdOrCtrl("b"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Bold")
		runtime.EventsEmit(ctx, "format:bold")
	})
	formatMenu.AddText("Italic", keys.CmdOrCtrl("i"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Italic")
		runtime.EventsEmit(ctx, "format:italic")
	})
	formatMenu.AddText("Underline", keys.CmdOrCtrl("u"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Underline")
		runtime.EventsEmit(ctx, "format:underline")
	})
	formatMenu.AddSeparator()
	formatMenu.AddText("Scene Heading", keys.Combo("H", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Scene Heading")
		runtime.EventsEmit(ctx, "format:sceneHeading")
	})
	formatMenu.AddText("Action", keys.Combo("a", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Action")
		runtime.EventsEmit(ctx, "format:action")
	})
	formatMenu.AddText("Character", keys.Combo("c", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Character")
		runtime.EventsEmit(ctx, "format:character")
	})
	formatMenu.AddText("Dialogue", keys.Combo("d", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Dialogue")
		runtime.EventsEmit(ctx, "format:dialogue")
	})
	formatMenu.AddText("Parenthetical", keys.Combo("p", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Parenthetical")
		runtime.EventsEmit(ctx, "format:parenthetical")
	})
	formatMenu.AddText("Transition", keys.Combo("t", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Transition")
		runtime.EventsEmit(ctx, "format:transition")
	})
	formatMenu.AddText("Shot", keys.Combo("s", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Shot")
		runtime.EventsEmit(ctx, "format:shot")
	})
	formatMenu.AddSeparator()
	formatMenu.AddText("Note", keys.CmdOrCtrl("m"), func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Note")
		runtime.EventsEmit(ctx, "format:note")
	})

	// if runtime.Environment(ctx).Platform == "darwin" {
	// appMenu.Append(menu.AppMenu())  // on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	appMenu.Append(menu.EditMenu()) // on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	// }

	appMenu.Append(menu.WindowMenu())

	helpMenu := appMenu.AddSubmenu("Help")
	helpMenu.AddText(fmt.Sprintf("%s Help", consts.AppName), nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "Help")
	})
	helpMenu.AddSeparator()
	helpMenu.AddText(fmt.Sprintf("About %s", consts.AppName), nil, func(_ *menu.CallbackData) {
		runtime.LogPrint(ctx, "About")
	})

	return appMenu
}
