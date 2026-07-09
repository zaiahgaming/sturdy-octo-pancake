import json

def load_high_score():
    try:
        with open('high_score.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return 0

def save_high_score(score):
    with open('high_score.json', 'w') as f:
        json.dump(score, f)

def update_high_score(current_score):
    high_score = load_high_score()
    if current_score > high_score:
        save_high_score(current_score)
        return current_score
    return high_score