# slips.py

from google.appengine.ext import ndb
from google.net.proto.ProtocolBuffer import ProtocolBufferDecodeError
import webapp2
import json
from utils import jsonDumps, getObj

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


    def post(self, id=None):
        """Create a slip."""

        # Get the body of the post.
        try: body = json.loads(self.request.body)
        except: self._writeErr(405, "Error: Couldn't get body data")

        # Prevent posting with an id.
        if id:
            self._sendErr(403, "Error: A slip cannot be posted with an id.")

        # Prevent duplicate numbered slips...
        if Slip.query(Slip.number == body['number']).get(): 
            self._sendErr(403, "Error: A slip of that numer already exists.")

        # If no errors, create the slip...
        if not self.err:
            body['arrival_date'] = "null";
            body['current_boat'] = "null";
            print("hello")
            print(body)
            new_slip = Slip(**body)
            new_slip.put()
            self.response.write(new_slip.toJsonStr())


    def get(self, id=None):
        """Get either a specific slip, or a list of all slips."""
        if id:

            # Attempt to get slip with given id.
            slip = getObj(id)

            # Send an error if no slip found with said id.
            if not slip: 
                self.sendErr(405, "Error: Bad slip id.")

            # If no error set, respond with slip info.
            if not self.err:
                self.response.write(slip.toJsonStr())
        else:
            # Get all slips.
            slips = Slip.query().fetch()

            # Populate the list of slips.
            slip_dicts = {'Slips':[]}
            for slip in slips: # Convert slips to a dictionary.
                slip_dicts['Slips'].append(json.loads(slip.toJsonStr()))

            # Send all slips.
            self.response.write(jsonDumps(slip_dicts))

    def patch(self, id=None):
        """Edit a slip."""
        # Enforce id requriement.
        if not id:
            self._sendErr(403, 'Error: Id Required for Patch')
        
        # If no error, attempt to get slip with given id, send error if not.
        if not self.err:
            slip = getObj(id)
            if not slip: 
                self.sendErr(405, "Error: Bad slip id.")

        # If no errors, get the body of the post.
        if not self.err:
            try: body = json.loads(self.request.body)
            except: self._sendErr(405, "Error: Couldn't get body data")

        # If no errors, then patch using body data.
        if not self.err:
            if 'number' in body:
                slip.number = body['number']
            slip.put()
            self.response.write(slip.toJsonStr())

    def delete(self, id=None):
        """Delete a slip."""
        # Enforce id requriement.
        if not id:
            self._sendErr(403, 'Error: Id Required for Delete.')

        # If no error, attempt to get slip with given id, send error if not.
        if not self.err:
            slip = getObj(id)
            if not slip: 
                self.sendErr(405, "Error: Bad slip id.")

        # If no errors, delete the slip.
        if not self.err:
            slip.key.delete()
            self.response.write('Slip Deleted')
