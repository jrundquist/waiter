package waiter

import (
	"log"
	"os"
	"os/user"
	"path"
	"runtime"
)

// returns the path to the appdata directory based on the current operating system
func getAppDataFolder() string {
	usr, err := user.Current()
	if err != nil {
		log.Fatal(err)
	}
	homeDir := usr.HomeDir

	switch runtime.GOOS {
	case "windows":
		return path.Join(os.Getenv("APPDATA"), AppName)
	case "linux":
		return path.Join(os.Getenv("HOME"), ".config", AppName)
	case "darwin":
		return path.Join(os.Getenv("HOME"), "Library", "Application Support", AppName)
	default:
		return path.Join(homeDir, "."+AppName)
	}
}
