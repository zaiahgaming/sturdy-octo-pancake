from playwright.sync_api import sync_playwright, expect
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/videos/")
        page = context.new_page()

        file_url = f"file://{os.path.abspath('index.html')}"
        page.goto(file_url)

        # Wait for start screen and verify cursor style on canvas
        page.wait_for_selector("#start-btn")

        # Verify canvas has crosshair cursor
        canvas = page.locator("#gameCanvas")
        cursor_style = canvas.evaluate("el => window.getComputedStyle(el).cursor")
        assert cursor_style == "crosshair", f"Expected crosshair cursor, got {cursor_style}"

        # Start game
        page.click("#start-btn")

        # Wait a bit for game to run
        page.wait_for_timeout(1000)

        # Let the player die to trigger game over
        # This will happen quickly since we are not moving
        page.wait_for_selector("#game-over", state="visible", timeout=10000)

        # Verify restart button has focus (active element)
        is_focused = page.evaluate("document.activeElement.id === 'restart-btn'")
        assert is_focused, "Restart button did not receive focus"

        # Take screenshot of game over screen
        page.screenshot(path="/home/jules/verification/verification.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
