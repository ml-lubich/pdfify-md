# Homebrew formula for pdfify-md (macOS / Apple Silicon).
#
# Puppeteer needs a Chrome binary, but Homebrew's build sandbox blocks its
# postinstall download. So we ship the matching Chrome for Testing as a verified
# `resource` (resources are fetched with network access + sha256 checked) and
# point Puppeteer straight at it via PUPPETEER_EXECUTABLE_PATH — no download at
# runtime, no reliance on a system browser.
#
# On each release, bump the npm `url`/`sha256`, and if the CLI's Puppeteer major
# changes, bump the Chrome `resource` to the version Puppeteer pins:
#   npm view pdfify-md dist.tarball                     # npm url
#   curl -sL <npm-tarball> | shasum -a 256              # npm sha256
#   curl -sL <cft-zip>     | shasum -a 256              # chrome sha256
class PdfifyMd < Formula
  desc "Convert markdown files to PDFs with Mermaid chart support"
  homepage "https://github.com/ml-lubich/pdfify-md"
  url "https://registry.npmjs.org/pdfify-md/-/pdfify-md-6.0.23.tgz"
  sha256 "d7b49102ca9db8064ede7b35746fe452047b5bb4b349d47c1697fb5dd009f5ff"
  license :cannot_represent

  depends_on arch: :arm64
  depends_on :macos
  depends_on "node"

  resource "chrome" do
    url "https://storage.googleapis.com/chrome-for-testing-public/148.0.7778.97/mac-arm64/chrome-mac-arm64.zip"
    sha256 "20f0155e9d75a31d32d168691110cd8fbc4d66f75dc6d7a53c004cbea60290b9"
  end

  def install
    ENV["PUPPETEER_SKIP_DOWNLOAD"] = "1"
    system "npm", "install", *std_npm_args

    resource("chrome").stage { (libexec/"chrome").install Dir["*"] }
    chrome = libexec/"chrome/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

    (bin/"pdfify-md").write_env_script(
      libexec/"bin/pdfify-md",
      PUPPETEER_SKIP_DOWNLOAD:   "1",
      PUPPETEER_EXECUTABLE_PATH: chrome,
    )
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/pdfify-md --version")
  end
end
