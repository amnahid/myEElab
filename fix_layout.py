import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# I will find the header start and main end and completely rebuild it.
header_start_idx = content.find("<header")
main_end_idx = content.find("</main>") + len("</main>")
if "      </div>\n    </div>" in content[main_end_idx:]:
    main_end_idx = content.find("      </div>\n    </div>") + len("      </div>")

# But wait, there is a lot of logic inside the JSX. It's safer to just replace the `<header>` and `<aside>` parts.
# Let's extract the header, aside, and main tags.
# Actually, the simplest way is to restore the file from git if possible.
