import random

# Game data
rooms = {
    'hallway': {'description': 'You are in a dark hallway.', 'exits': ['kitchen', 'garden']},
    'kitchen': {'description': 'You are in a kitchen.', 'exits': ['hallway', 'pantry']},
    'garden': {'description': 'You are in a beautiful garden.', 'exits': ['hallway', 'shed']},
    'pantry': {'description': 'You are in a small pantry.', 'exits': ['kitchen']},
    'shed': {'description': 'You are in a shed.', 'exits': ['garden']},
}

# Game loop
def game():
    current_room = 'hallway'
    while True:
        print(rooms[current_room]['description'])
        print('Exits:', rooms[current_room]['exits'])
        command = input('What do you want to do? ').lower().split()
        if command[0] == 'go':
            if command[1] in rooms[current_room]['exits']:
                current_room = command[1]
            else:
                print('You cannot go that way.')
        elif command[0] == 'quit':
            break
        else:
            print('Invalid command.')

if __name__ == '__main__':
    game()
