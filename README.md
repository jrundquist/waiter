# wAIter

`wAIter` is a multi-user collaborative script writing application featuring an integrated AI assistant. It is designed to assist both individual writers and teams in the creation of scripts, acting much like a waiter at your service. It uses electron node.js backend and a Typescript + React frontend. This application brings the power of AI into the world of script writing, much like Final Draft but with the added AI twist.

## Features

- Multi-user collaboration for script writing.
- Integrated AI assistant for script generation and editing.
- Built with Wails for a seamless desktop experience.
- Golang backend for performance and efficiency.
- Typescript + React frontend for a modern, interactive user interface.

## Development

To run in live development mode, run `yarn dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes.

## Research Reading List

- [Golang GPT Implementation](https://github.com/go-aie/gptbot)
  - [Python Version for inspiration](https://github.com/jerryjliu/llama_index)
- [Sentence BERT](https://towardsdatascience.com/an-intuitive-explanation-of-sentence-bert-1984d144a868)
- [Collaborative Editing using CRDT](https://pierrehedkvist.com/posts/collaborative-editing-using-crdts)
  - [code](https://github.com/phedkvist/crdt-woot)

## Building

To build a redistributable, production mode package, use `yarn build`.
