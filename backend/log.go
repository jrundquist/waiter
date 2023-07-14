package waiter

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"runtime"
)

// RecoverAndLog Recovers and then logs the stack
func RecoverAndLog() {
	if r := recover(); r != nil {
		fmt.Println("Panic digested from ", r)

		log.Printf("Internal error: %v", r)
		buf := make([]byte, 1<<16)
		stackSize := runtime.Stack(buf, true)
		//log.Printf("%s\n", string(buf[0:stackSize]))

		var dir, err = os.UserHomeDir()
		if err != nil {
			log.Fatal(err)
		}
		var logPathOS = dir + string(os.PathSeparator) + "waiter-paniclog.txt"
		f, _ := os.OpenFile(logPathOS, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
		w := bufio.NewWriter(f)
		w.WriteString(string(buf[0:stackSize]))
		w.Flush()
	}
}
