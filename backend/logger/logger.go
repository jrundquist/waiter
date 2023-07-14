package logger

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"path"
	"runtime"
	"waiter/backend/filesystem"
)

// RecoverAndLog Recovers and then logs the stack
func PanicLogger() {
	if r := recover(); r != nil {
		fmt.Println("Panic digested from ", r)

		log.Printf("Internal error: %v", r)
		buf := make([]byte, 1<<16)
		stackSize := runtime.Stack(buf, true)
		//log.Printf("%s\n", string(buf[0:stackSize]))

		var logPathOS = path.Join(filesystem.GetAppDataFolder(), "waiter-paniclog.txt")
		f, _ := os.OpenFile(logPathOS, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
		w := bufio.NewWriter(f)
		w.WriteString(string(buf[0:stackSize]))
		w.Flush()
		f.Close()
	}
}
