# setup-waypoint

This action sets up Waypoint for use by other actions by
installing and configuring the CLI to communicate with an external
Waypoint server.

Waypoint must be running in server mode on a network that the GitHub actions
runner can communciate with for this action to be used.

## Usage

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: hashicorp/actions-setup-waypoint
    with:
      version: '0.1.0'
- run: waypoint build
```

## Development

Install the dependencies

```bash
$ npm install
```

Build the typescript and package it for distribution

```bash
$ npm run build && npm run package
```

Run the tests

```bash
$ npm test
...
```
