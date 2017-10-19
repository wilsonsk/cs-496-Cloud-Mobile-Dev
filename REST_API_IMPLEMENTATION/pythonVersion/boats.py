# boats.py

from google.appengine.ext import ndb
import webapp2
import json
from utils import jsonDumps, getObj

# Boat class model with associated properties
class Boat(ndb.Model):
	name = ndb.StringProperty(required=True)
	type = ndb.StringProperty(required=True)
	length = ndb.IntegerProperty(required=True)
	at_sea = ndb.BooleanProperty(required=True)
	slip = ndb.StringProperty()

class BoatHandler(webapp2.RequestHandler):

# Constructor
	def __init__(self, *args, **kwargs):
		self.err = False
		super(BoatHandler, self).__init__(*args, **kwargs)
# Private member function    
	def _writeErr(self, code, message):
# Send an error status
# Set the err flag
		self.response.status = code
		self.response.write(message)
		self.err=True
	#
	# POST
	# CREATE a new Boat
	#
	def post(self):
		# Attempt to get request body
		try: 
			body = json.loads(self.request.body.decode("utf-8"))
		except:
			self._sendErr(405, 'Error: Body invalid JSON.')

		if not self.err:
			# Intially set to True
			body['at_sea'] = True

			# Instantiate
			boat_entity = Boat(**body) # keyword arg passes entire key/value store of json body to new Boat instance

			# Store boat entity in datastore 
			boat_entity.put()

			# to_dict returns a dict containing the model's property values
			boat_dict = boat_entity.to_dict()

			# Set boat's self url
			# urlsafe() returns an encoded string suitable for embedding in URL
			# ['self'] is the reference to the location of this entity
			boat_dict['self'] = '/boats/' + boat_entity.key.urlsafe()

			# Responde to request with JSON boat dict data 
			# Format via utils.jsonDumps
			self.response.write(jsonDumps(boat_dict))


	# 
	# GET
	# Retrieve a specific boat entity or all boats
	#
	def get(self, id=None):
		# If an id passed, attempt to return specific boat's data.
		# Use utils.getObj for entity retrieval via ID number
		if id:
			boat = getObj(id)
			if boat:

		# Convert boat obj to dict for property look up
				boat_dict = boat.to_dict()
				boat_dict['self'] = '/boats/' + id
				self.response.write(jsonDumps(boat_dict))
			else:
				writeErr(405, "Error: Invalid Boat ID.")

		# Else return the data for all boats.
		else:
			# Retrieve all boats.
			boats = Boat.query().fetch()

			# Convert all boats objects to dictionaries
			boat_dicts = {'Boats':[]}
			for boat in boats: 
				id = boat.key.urlsafe()
				boat_data = boat.to_dict()
				# Assign self, id
				boat_data['self'] = '/boats/' + id
				boat_data['id'] = id
				# Append this data to the response
				boat_dicts['Boats'].append(boat_data)

			# Send response boat data
			self.response.write(jsonDumps(boat_dicts))

	# 
	# PATCH
	# MODIFY a boat - Maintain any previous values of properties not updated
	#
	def patch(self, id=None):
		if id:
			# Get entity of boat ID
			boat = ndb.Key(urlsafe=id).get()
			# If a boat entity is returned:
			if boat:
				# Load json request data into a boat_data object
				boat_data = json.loads(self.request.body)
				#boat.id = boat.id
				if 'name' in boat_data:
					boat.name = boat_data['name']
				if 'length' in boat_data:
					boat.length = boat_data['length']
				if 'type' in boat_data:
					boat.type = boat_data['type']
				boat.put()
				boat_dict = boat.to_dict()
				self.response.write(jsonDumps(boat_dict))
			else:
				self.response.status = "405 Invalid Id";
				self.response.write('Error: Invalid Id Provided')
		else:
			self.response.status = "403 No ID";
			self.response.write('Error: Id Required for Patch')

	# 
	# PUT
	# REPLACE a boat - Change any previous values of properties not updated to default values
	#		 - Update 'at_sea' to value of true for boat to be replaced
	#		 - Update current slip.current_boat to replacement boat 
	#		 - Update current slip.arrival_date to replacement value
	#		 - Update replacement boat.at_sea to value of false
	#		 - Update slip dict with corresponding correct format URLs
	def put(self, id=None):
		if id:
			# Get entity of boat ID
			boat = ndb.Key(urlsafe=id).get()
			# If a boat entity is returned:
			if boat:
				# Load json request data into a boat_data object
				boat_data = json.loads(self.request.body)
				boat.id = id
				if 'name' in boat_data:
					boat.name = boat_data['name']
				else:
					boat.name = "Value Replaced with this Default String (PUT)"
				if 'length' in boat_data:
					boat.length = boat_data['length']
				else:
					boat.length = 0
				if 'type' in boat_data:
					boat.type = boat_data['type']
				else:
					boat.type = "Value Replaced with this Default String (PUT)"
				boat.put()
				boat_dict = boat.to_dict()
				self.response.write(jsonDumps(boat_dict))
			else:
				self.response.status = "405 Invalid Id";
				self.response.write('Error: Invalid Id Provided')
		else:
			self.response.status = "403 No ID";
			self.response.write('Error: Id Required for Put')

	



	# 
	# DELETE
	# REMOVE a specific boat entity or all boat entities
	# 
	def delete(self, id=None):
		if id:
			boat = ndb.Key(urlsafe=id).get()
			if boat:
				boat.key.delete()
				self.response.write('Boat Deleted')
			else:
				self.response.status = "405 Invalid ID";
				self.response.write('Error: Invalid Boat ID')
		else:
			self.response.status = "403 Missing ID";
			self.response.write('Error: Id Required for DELETE Request')
