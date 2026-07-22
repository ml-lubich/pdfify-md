# Homebrew packaging

`pdfify-md.rb` is the Homebrew formula for this tool. It installs the published
npm package and ships Puppeteer's Chromium inside the keg (see the formula
header for why).

## Publish as a tap (one-time)

So users can run `brew install ml-lubich/tap/pdfify-md`:

```bash
# 1. Create a PUBLIC repo named exactly `homebrew-tap` (skip if it already exists):
gh repo create ml-lubich/homebrew-tap --public --description "Homebrew tap for ml-lubich CLI tools"

# 2. Add the formula and push:
git clone https://github.com/ml-lubich/homebrew-tap.git /tmp/tap
mkdir -p /tmp/tap/Formula
cp packaging/homebrew/pdfify-md.rb /tmp/tap/Formula/pdfify-md.rb
cd /tmp/tap && git add . && git commit -m "pdfify-md 6.0.23" && git push
```

Then anyone can:

```bash
brew install ml-lubich/tap/pdfify-md
```

One tap can hold many formulas — drop `confluence-cli.rb` in the same
`Formula/` directory to serve both tools from `ml-lubich/tap`.

## On each release

Bump `url` + `sha256` to the new npm tarball:

```bash
npm view pdfify-md dist.tarball          # the URL
curl -sL <tarball-url> | shasum -a 256   # the sha256
```

## Install without a tap

It is already on npm, so the simplest install is:

```bash
npm install -g pdfify-md
```
