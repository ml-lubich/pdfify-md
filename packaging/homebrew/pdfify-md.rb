# Homebrew formula for pdfify-md.
#
# Puppeteer needs a Chromium binary. Rather than depend on a system browser, we
# let Puppeteer download its matching Chromium INTO the keg (libexec) at install
# time and point the CLI at it with a runtime env wrapper. That keeps the tool
# self-contained and version-matched.
#
# To publish as a tap so users can `brew install ml-lubich/tap/pdfify-md`, see
# packaging/homebrew/README.md. On each release bump `url` + `sha256`:
#   npm view pdfify-md dist.tarball
#   curl -sL <tarball> | shasum -a 256
class PdfifyMd < Formula
  desc "Convert markdown files to PDFs with Mermaid chart support"
  homepage "https://github.com/ml-lubich/pdfify-md"
  url "https://registry.npmjs.org/pdfify-md/-/pdfify-md-6.0.23.tgz"
  sha256 "d7b49102ca9db8064ede7b35746fe452047b5bb4b349d47c1697fb5dd009f5ff"
  license :cannot_represent

  depends_on "node"

  def install
    # Ship Puppeteer's Chromium inside the keg so nothing is downloaded at
    # runtime; the wrapper below points the CLI at the same cache dir.
    ENV["PUPPETEER_CACHE_DIR"] = "#{libexec}/.cache/puppeteer"
    system "npm", "install", *std_npm_args
    (bin/"pdfify-md").write_env_script(
      libexec/"bin/pdfify-md",
      PUPPETEER_CACHE_DIR: "#{libexec}/.cache/puppeteer",
    )
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/pdfify-md --version")
  end
end
