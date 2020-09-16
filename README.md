# setup-waypoint

This action sets up Waypoint for use by other actions by
installing and configuring the CLI to communicate with an external
Waypoint server.

This action is a building block for using Waypoint with
GitHub Actions. If you are interested in automatically deploying,
annotating, and releasing with Waypoint and GitHub actions,
see the [hashicorp/action-waypoint-deployment] action, which uses this one.

Waypoint must be running in server mode on a network that the GitHub actions
runner can communciate with for this action to be used.

## Usage

```yaml
env:
  WAYPOINT_SERVER_TOKEN: ${{ secrets.WAYPOINT_SERVER_TOKEN }}
  WAYPOINT_SERVER_ADDR: waypoint.example.com:9701
  WAYPOINT_SERVER_TLS: 1
  WAYPOINT_SERVER_TLS_SKIP_VERIFY: 1

steps:
  - uses: actions/checkout@v2
  - uses: hashicorp/actions-setup-waypoint
    with:
      version: '0.1.0'
- run: waypoint init
- run: waypoint build
```

## Inputs

| Input     | Description                        | Default | Required |
| --------- | ---------------------------------- | ------- | -------- |
| `version` | The version of Waypoint to install |         | ✔        |

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
