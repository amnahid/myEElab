import sys

def update_roadmap(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()

    inside_track_a = False
    for i in range(len(lines)):
        line = lines[i]
        if line.startswith("## 8. Track A"):
            inside_track_a = True
        elif line.startswith("## 9. Track B"):
            inside_track_a = False
        
        if inside_track_a:
            if line.startswith("### Phase A"):
                if " [DONE]" not in line and " ✅" not in line:
                    lines[i] = line.rstrip() + " [DONE]\n"
            elif line.strip().startswith("- [ ]"):
                lines[i] = line.replace("- [ ]", "- [x]", 1)

    with open(file_path, 'w') as f:
        f.writelines(lines)

if __name__ == "__main__":
    update_roadmap("/home/warrio/Projects/myEElab/ROADMAP.md")
