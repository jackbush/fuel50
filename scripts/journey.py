"""Walk the key journey end to end and screenshot each step.
Usage: pip install playwright && playwright install chromium
       npm run dev  (in another terminal)
       python scripts/journey.py screenshots/
"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:5173/")
OUT = sys.argv[1]
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}))
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    def shot(n):
        pg.screenshot(path=f"{OUT}/{n}.png")

    pg.goto(BASE + "#/start"); pg.wait_for_timeout(400); shot("01_email")
    pg.get_by_role("button", name="Confirm my skills").click(); pg.wait_for_timeout(300); shot("02_skills_since")
    pg.get_by_role("button", name="Review 3 that need attention").click(); pg.wait_for_timeout(200); shot("03_rate_1")
    # rate the 3 flagged skills
    for lvl in ["Skilled", "Skilled", "Basic"]:
        pg.locator(".level-option", has_text=lvl).first.click()
        btn = pg.locator(".rate-card").get_by_role("button", name="Next", exact=True)
        if btn.count():
            btn.click()
        else:
            pg.get_by_role("button", name="Send to Priya", exact=True).click()
        pg.wait_for_timeout(150)
    shot("04_done")
    pg.locator(".options a").first.click(); pg.wait_for_timeout(300); shot("05_gig_with_back")
    pg.get_by_role("button", name="Apply", exact=True).click(); pg.wait_for_timeout(150)
    pg.get_by_label("Yes").check(); pg.get_by_role("button", name="Send application").click(); pg.wait_for_timeout(300); shot("06_applied_toast")
    pg.get_by_role("button", name="← Back to your skills results").click(); pg.wait_for_timeout(300); shot("07_back")
    pg.get_by_role("link", name="Fuel50 Home").click(); pg.wait_for_timeout(300); shot("08_home_after")
    # nav menu with children
    pg.get_by_role("button", name="Explore", exact=False).first.click(); pg.wait_for_timeout(150); shot("09_explore_menu")
    pg.keyboard.press("Escape")
    # search for a synonym
    pg.keyboard.press("Control+k"); pg.wait_for_timeout(150); pg.keyboard.type("talents"); pg.wait_for_timeout(200); shot("10_search_talents")
    pg.keyboard.press("Escape")
    # renamed tenant, from the prototype sidebar
    pg.get_by_role("button", name="Prototype").click()
    pg.locator(".pp-segment").get_by_text("Northbank (renamed)").click(); pg.wait_for_timeout(300); shot("11_northbank_home")
    pg.keyboard.press("Control+k"); pg.keyboard.type("mentor"); pg.wait_for_timeout(200); shot("12_northbank_search")
    pg.keyboard.press("Escape")
    pg.goto(BASE + "#/growth/targets"); pg.wait_for_timeout(300); shot("13_targets_northbank")
    # leader mode
    pg.locator(".pp-choice", has_text="Weekly manager").click(); pg.wait_for_timeout(300); shot("14_leader_team")
    pg.goto(BASE + "#/team/reviews"); pg.wait_for_timeout(300)
    pg.locator(".dot-btn").nth(2).click(); shot("15_reviews")
    # first visit
    pg.locator(".pp-choice", has_text="First visit").click(); pg.wait_for_timeout(300); shot("16_first_home")
    b.close()

print("ERRORS:", errors)
