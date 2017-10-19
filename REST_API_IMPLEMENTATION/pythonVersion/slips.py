# slips.py

from google.appengine.ext import ndb
from google.net.proto.ProtocolBuffer import ProtocolBufferDecodeError
import webapp2
import json
from utils import jsonDumps, getObj
import json as simplejson

# Boat class model with associated properties
class Slip(ndb.Model):
	number = ndb.IntegerProperty(required=True)
	current_boat = ndb.StringProperty(required=True) 
	arrival_date = ndb.StringProperty(required=True) 

	# Retrieve the key from this entity
	# Convert slip object to dict for formatting purposes
	# Assign ID to id
	# Append id onto URL and assign to self (for location purposes)
	def formatSlip(self):
		id = self.key.urlsafe()
		slip_data = self.to_dict()
		slip_data['id'] = id
		slip_data['self'] = '/slips/' + id
		# If this a boat occupies this current slip then assign the boat_link propert the URL of the slip entities current boat
		if slip_data['current_boat'] != 'null':
			slip_data['boat_link'] = '/boats/' + slip_data['current_boat']
		return jsonDumps(slip_data)



class SlipHandler(webapp2.RequestHandler):

	# Constructor
	def __init__(self, *args, **kwargs):
		self.err = False
		super(SlipHandler, self).__init__(*args, **kwargs)


	# Private member function    
	def _writeErr(self, code, message):
		# Send an error status
		# Set the err flag
		self.response.status = code
		self.response.write(message)
		self.err=True

	#
	# POST
	# CREATE a new Slip
	#
	def post(self, id=None):
		# Attempt to get request body
		body = json.loads(self.request.body.decode("utf-8"))
		if not body:
			self._writeErr(405, "Error: Body invalud JSON")

		# Error check for prohibited ID
		if id:
			self._writeErr(403, "Error: ID's are prohibited with POST.")

		# Error check against duplicate slip numbers
		if Slip.query(Slip.number == body['number']).get(): 
			self._writeErr(403, "Error: Slip number already exists.")

		# If no errors, create a new slip entity
		if not self.err:
			body['arrival_date'] = "null";
			body['current_boat'] = "null";
			# Instantiate
			slip_entity = Slip(**body)
			slip_entity.put()
			print("DEBUG: Created new slip entity")
			print(body)
			self.response.write(slip_entity.formatSlip())
	# 
	# GET
	# Retrieve a specific slip entity or all slips
	#
	def get(self, id=None):
		# If an id passed, attempt to return specific slips's data
		# Use utils.getObj for entity retrieval via ID number
		if id:
			slip = getObj(id)

			# If no slip entity returned from ID, write an error 
			if not slip: 
				self.writeErr(405, "Error: Invalid slip ID.")

			# If no error, send response specific slip data
			if not self.err:
				self.response.write(slip.formatSlip())

			# Else return the data for all boats
		else:
			# Retrieve all boats
			slips = Slip.query().fetch()

			# Create an empty list to populate with slips
			slip_dicts = {'Slips':[]}
			# Format each slip and append it to the slips list
			for slip in slips: 
				slip_dicts['Slips'].append(json.loads(slip.formatSlip()))

			# Send response slips data
			self.response.write(jsonDumps(slip_dicts))

	# 
	# PATCH
	# MODIFY a slip - Maintain any previous values of properties not updated
	#
	def patch(self, id=None):
		# Enforce id requriement.
		if id:
			slip = getObj(id)
			if slip: 
				body = json.loads(self.request.body.decode("utf-8"))
				if not body:
					self._writeErr(405, "Error: Body invalid JSON")
				if 'number' in body:
					slip.number = body['number']
					slip.put()
					self.response.write(slip.formatSlip())
			else:
				self.writeErr(405, "Error: Invalid slip ID.")
		else:
			self.response.status = "403 Missing ID";
			self._writeErr(403, 'Error: Id Required for Patch')
        # 
        # PUT
        # REPLACE a slip - slip_id = URL param; boat_id (NEW current_boat) = body param
        # 		 - Change any previous values of properties not updated to default values
        #                - Update 'at_sea' to value of true for boat to be replaced -- EDIT: instead prohibit adding boat to preoccupied slip
        #                - Update current slip.current_boat to replacement boat 
        #                - Update current slip.arrival_date to replacement value
        #                - Update replacement boat.at_sea to value of false
        #                - Update slip dict with corresponding correct format URLs (Prepend api resource to url of current_boat and slip propery of boat) for display via response send
        def put(self, slip_id=None):
		if slip_id:
			# Get request body (and decode)
			body = json.dumps(self.request.body.decode("utf-8"))
			if not body:
				self._writeErr(405, 'Error: Body invalid JSON.')
	
			# Get boat entity from current_boat body variable
			if not self.err:
				boat = getObj(body['current_boat'])
				if not boat:
					self._writeErr(405, 'Error: Body invalid curent_boat (id).')
	
			# Get slip entity from slip_id URL param
			if not self.err:
				slip = getObj(slip_id)
				if not slip:
					self.writeErr(405, 'Error: URL invalid slip id')
	
			# Prevent adding boat to preoccupied slip 
			if not self.err:
				if slip.current_boat != 'null':
					self.writeErr(403, 'Error: Slip is preoccupied')
	
			# Manage slip transaction
			if not self.err:
				slip.arrival_date = body['arrival_date']
				slip.current_boat = body['current_boat']
				boat.at_sea = False
				boat.slip = slip_id
				
				slip.put()
				boat.put()

				# format URLs for displaying
				slip_dict = slip.to_dict()
				boat_dict = boat.to_dict()
				
				slip_dict['current_boat'] = '/boats/' + body['current_boat']
				boat_dict['slip'] = '/slips/' + slip_id

				self.response.write(jsonDumps(slip_dict))
				self.response.write(jsonDumps(boat_dict))
		else: 
			self.response.status = "403 Missing ID";
			self._writeErr(403, 'Error: Id Required for Put')
	# 
	# DELETE
	# REMOVE a specific slip entity or all slip entities
	# 
	def delete(self, id=None):
		if not id:
			self._writeErr(403, 'Error: Id Required for Delete Request.')

		if not self.err:
			slip = getObj(id)
			if not slip: 
				self.writeErr(405, "Error: Invalid slip ID.")

		if not self.err:
			b_k = slip.current_boat
			b = getObj(b_k)
			if b:
				b.at_sea = True	
				b.slip = ""
				b.put()
	
			slip.key.delete()
			self.response.write('Slip Deleted')
