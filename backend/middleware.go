package waiter

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// MiddlewareFunctions struct to hold wails runtime for all middleware implementations
type MiddlewareFunctions struct {
	ctx context.Context
}

// setContext sets the context for the middleware functions
func (s *MiddlewareFunctions) setContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *MiddlewareFunctions) Greet(Name string) string {
	runtime.WindowSetTitle(s.ctx, fmt.Sprintf("Hello %s", Name))
	return fmt.Sprintf("Hello %s, It's show time!!!", Name)
}
