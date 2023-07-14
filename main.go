package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"

	waiter "waiter/backend"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	waiter.RecoverAndLog()

	// Create an instance of the app structure
	app := waiter.NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:         waiter.AppName,
		Width:         1320,
		Height:        780,
		MinWidth:      840,
		MinHeight:     580,
		DisableResize: false,
		Frameless:     false,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{
			R: 27,
			G: 38,
			B: 54,
			A: 100,
		},
		OnStartup: app.Startup,
		Bind: []interface{}{
			app.Middleware,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
		Mac: &mac.Options{
			Appearance: mac.DefaultAppearance,
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: false,
				HideTitle:                  false,
				HideTitleBar:               false,
				FullSizeContent:            false,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			About: &mac.AboutInfo{
				Title:   waiter.AppName,
				Message: waiter.CopyRight,
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
