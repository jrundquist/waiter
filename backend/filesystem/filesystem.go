package filesystem

import (
	"log"
	"os"
	"os/user"
	"path"
	"runtime"
	"waiter/backend/consts"
)

// returns the path to the appdata directory based on the current operating system
func GetAppDataFolder() string {
	usr, err := user.Current()
	if err != nil {
		log.Fatal(err)
	}
	homeDir := usr.HomeDir

	switch runtime.GOOS {
	case "windows":
		return path.Join(os.Getenv("APPDATA"), consts.AppName)
	case "linux":
		return path.Join(os.Getenv("HOME"), ".config", consts.AppName)
	case "darwin":
		return path.Join(os.Getenv("HOME"), "Library", "Application Support", consts.AppName)
	default:
		return path.Join(homeDir, "."+consts.AppName)
	}
}
