let accCode = `from microbit import *

def accelerometer_to_position(acc):
	v = int((acc + 1000) / 2000 * 5)
	return max(0, min(4, v))

while True:
	x = accelerometer_to_position(accelerometer.get_x())
	y = 4 - accelerometer_to_position(accelerometer.get_y())
	display.clear()
	display.set_pixel(x, y, 9)
	sleep(100)
`;

let micCode = `from microbit import *

waveform = [0, 0, 0, 0, 0]
while True:
	print(microphone.sound_level())
	sample = int(microphone.sound_level() / 255 * 5)
	sample = max(0, min(4, sample))
	waveform.pop()
	waveform.insert(0, sample)

	display.clear()
	for t in range(5):
		for y in range(waveform[t]):
			display.set_pixel(t, 4 - y, 9)
	sleep(200)
`;

let patternCode = `from microbit import *

x = 0
while True:
	display.clear()
	for y in range(5):
		if x - y >= 0 and x - y < 5:
			display.set_pixel(x - y, y, 9)
	x = (x + 1) % 9
	sleep(100)
`;


let battleshipsCode = `from microbit import *

SHIP_LENS = [3, 2, 2]

HORIZONTAL_ROTATION = 0
VERTICAL_ROTATION = 1
HIT_COLOUR = 7
UNHIT_COLOUR = 5
MISS_COLOUR = 2

class Position:
	def __init__(self, x, y):
		self.x = x
		self.y = y

class ShipTile:
	def __init__(self, x, y):
		self.x = x
		self.y = y
		self.hit = False

class Ship:
	def __init__(self, left_x, top_y, ship_len, rotation):
		self.x = left_x
		self.y = top_y
		self.ship_len = ship_len
		self.rotation = rotation
		self.tiles = [ShipTile(*pos) for pos in self.get_ship_tiles()]

	def serialize(self):
		return "{},{},{},{}".format(
			str(self.x),
			str(self.y),
			str(self.ship_len),
			str(self.rotation)
		)

	def deserialize(self, data):
		props = [int(p) for p in data.split(",")]
		return Ship(*props)
	
	def get_ship_tiles(self):
		if self.rotation == HORIZONTAL_ROTATION:
			return [(self.x + i, self.y) for i in range(self.ship_len)]
		else:
			return [(self.x, self.y + i) for i in range(self.ship_len)]

	def get_overlapping_ship_tiles(self, other_ships):
		overlapping_tiles = []
		for ship in other_ships:
			for tile in ship.tiles:
				for own_tile in self.tiles:
					if tile.x == own_tile.x and tile.y == own_tile.y:
						overlapping_tiles.append((tile.x, tile.y))
		return overlapping_tiles

	def is_sunk(self):
		for tile in self.tiles:
			if not tile.hit:
				return False
		return True
		
	def ship_hit(self, x, y):
		for tile in self.tiles:
			if tile.x == x and tile.y == y:
				tile.hit = True
				return True

		return False

	def display_ship(self, brightness):
		for tile in self.tiles:
			display.set_pixel(tile.x, tile.y, brightness)

	def display_hit_ship(self):
		for tile in self.tiles:
			if tile.hit:
				display.set_pixel(tile.x, tile.y, HIT_COLOUR)   

	def blink_ship(self):
		blink_count = 3
		for _ in range(blink_count):
			for brightness in (0, 9):
				for tile in self.tiles:
					display.set_pixel(tile.x, tile.y, brightness)
				sleep(200)

def check_pixel(x, y):
	if x < 0 or x > 4 :
		return False
	if y < 0 or y > 4 :
		return False
	return True

def show_led_half(x, y):
	if check_pixel(x, y):
		display.set_pixel(x,y, MISS_COLOUR)

def show_led(x, y):
	if check_pixel(x, y):
		display.set_pixel(x,y,9)

def clear_led(x, y):
	if check_pixel(x, y):
		display.set_pixel(x,y,0)
		
def explosion(x, y, size=2):
	x -= 1
	y -= 1
	
	for i in range(3):
		for j in range(3):
			show_led(x+i,y+j)

	clear_led(x+1, y+1)
	sleep(50)
		
def game_over():
	x = 2
	y = 2
	display.clear()
	show_led(x, y)
	sleep(500)
		
	x -= 1
	y -= 1
	
	for i in range(3):
		for j in range(3):
			show_led(x+i,y+j)

	sleep(500)
	x -= 1
	y -= 1
	
	for i in range(5):
		for j in range(5):
			show_led(x+i,y+j)

	sleep(500)
	display.scroll('GAME OVER')

# Checks if the given shot has hit one of the ships
def check_shot(x, y, ship_list):
	# Check if the shot hit any of the ships that are saved
	for ship in ship_list:
		if ship.ship_hit(x,y):
			return ship
	return None

def miss_shot(x, y, missed_shots):
	clear_led(x,y)
	miss_position = Position(x,y)
	missed_shots.append(miss_position)

def get_ship_placement_bounds(ship_len, rotation):
	if rotation == HORIZONTAL_ROTATION:
		return (0, 5 - ship_len, 0, 4)
	else:
		return (0, 4, 0, 5 - ship_len)

def clamp(v, lower, upper):
	return max(lower, min(upper, v))

def get_position_from_accelerometer():
	def accelerometer_to_position(acc):
		v = int((acc + 1000) / 2000 * 5)
		return clamp(v, 0, 4)
		
	x_acc = accelerometer.get_x()
	y_acc = accelerometer.get_y()
	return (
		accelerometer_to_position(x_acc),
		accelerometer_to_position(y_acc)
	)

def display_placement_error(existing_ships, new_ship, overlapping_tiles):
	for _ in range(2):
		display.clear()
		for placed_ship in existing_ships:
			placed_ship.display_ship(4)
		new_ship.display_ship(9)
		
		for brightness in (4, 9):
			for tile_x, tile_y in overlapping_tiles:
				display.set_pixel(tile_x, tile_y, brightness)
			sleep(200)

def run_placement():

	# Clear key press buffer
	button_a.was_pressed()
	button_b.was_pressed()

	placed_ships = []
	rot = HORIZONTAL_ROTATION
	
	for ship_len in SHIP_LENS:
		x = 0
		y = 0
		(x_min, x_max, y_min, y_max) = get_ship_placement_bounds(ship_len, rot)
		
		while True:
			(x, y) = get_position_from_accelerometer()
			x = clamp(x, x_min, x_max)
			y = clamp(y, y_min, y_max)
			
			new_ship = Ship(x, y, ship_len, rot)
			
			if button_a.was_pressed():
				# Toggle rotation
				rot = 1 - rot
				(x_min, x_max, y_min, y_max) = get_ship_placement_bounds(ship_len, rot)
				x = clamp(x, x_min, x_max)
				y = clamp(y, y_min, y_max)
			elif button_b.was_pressed():
				# Check overlap with existing ships
				overlapping_tiles = new_ship.get_overlapping_ship_tiles(placed_ships)
				if overlapping_tiles:
					# Some tiles are overlapping. Flash those tiles.
					display_placement_error(placed_ships, new_ship, overlapping_tiles)
				else:
					# Set ship and move onto next ship
					placed_ships.append(new_ship)
					break

			display.clear()
			for placed_ship in placed_ships:
				placed_ship.display_ship(4)
			new_ship.display_ship(9)
			sleep(50)

	# Display all placed ships for a moment before finishing routine
	display.clear()
	for placed_ship in placed_ships:
		placed_ship.display_ship(9)
	sleep(3000)

	return placed_ships

def check_win(ship_list):
	for ship in ship_list:
		if not ship.is_sunk():
			return False
	return True

def run_game(ship_list):
	missed_shots = [] # A list to keep track of shots missed.

	x = 2
	y = 2
	
	while True: 
		sleep(100)
		display.clear()
		
		# Show the game board
		for ship in ship_list:
			ship.display_hit_ship()
		for missed_shot in missed_shots:
			show_led_half(missed_shot.x, missed_shot.y)

		# Show the position
		lock_position = button_b.is_pressed()
		if not lock_position:
			(x, y) = get_position_from_accelerometer()
		show_led(x,y)

		# To fire a shot you have to shot
		if  microphone.sound_level() > 100 and lock_position:
		#if button_a.is_pressed():
			ship_hit = check_shot(x, y, ship_list)
			if ship_hit:
				# Ship has been hit
				explosion(x, y)
				if ship_hit.is_sunk():
					sleep(200)
					ship_hit.blink_ship()
				
				if check_win(ship_list):
					return
			else:
				miss_shot(x, y, missed_shots)
			sleep(100)

def intro_explosion(x, y, size=2, brightness=9, clear=True):
	def set_pixel(x, y):
		if check_pixel(x, y):
			display.set_pixel(x, y, brightness)
	
	for ring in range(0, size):
		for dx in range(-ring, ring + 1):
			set_pixel(x + dx, y - ring)
			set_pixel(x - dx, y + ring)
		for dy in range(-ring, ring + 1):
			set_pixel(x - ring, y + dy)
			set_pixel(x + ring, y + dy)
		sleep(100)
		
	if clear:
		display.clear()
	sleep(200)

def intro_screen():
	intro_explosion(1, 2)
	intro_explosion(3, 1)
	intro_explosion(2, 3)

	intro_explosion(2, 2)
	intro_explosion(2, 2)
	intro_explosion(2, 2, 5, clear=False)
	intro_explosion(2, 2, 5, brightness=0)
	
	display.scroll("BATTLESHIPS")

def main():
	while True:
		intro_screen()
		ship_list = run_placement()
		run_game(ship_list)
		game_over()

main()
`;
