package ai

import (
	"context"
	"sort"
	"strconv"
	"strings"

	"github.com/go-aie/gptbot"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type MyStore struct {
	*gptbot.LocalVectorStore
}

func NewMyStore() *MyStore {
	return &MyStore{
		LocalVectorStore: gptbot.NewLocalVectorStore(),
	}
}
func (s *MyStore) Query(ctx context.Context, embedding gptbot.Embedding, corpusID string, topK int) ([]*gptbot.Similarity, error) {
	sim, err := s.LocalVectorStore.Query(ctx, embedding, corpusID, topK)
	if err != nil {
		return nil, err
	}

	sort.SliceStable(sim, func(p, q int) bool {
		pID := strings.Replace(sim[p].ID, "_", ".", 1)
		qID := strings.Replace(sim[q].ID, "_", ".", 1)
		if pFloat, err := strconv.ParseFloat(pID, 32); err != nil {
			return sim[p].Score < sim[q].Score
		} else if qFloat, err := strconv.ParseFloat(qID, 32); err != nil {
			return sim[p].Score < sim[q].Score
		} else {
			return pFloat < qFloat
		}
	})

	// Print out each similarity score
	for _, s := range sim {
		runtime.LogPrintf(ctx, "similarity: %+v\n", s)
		runtime.LogPrintf(ctx, "Chunk: %v - %s\n\n", s.Chunk.ID, s.Chunk.Text)
	}

	return sim, nil
}
