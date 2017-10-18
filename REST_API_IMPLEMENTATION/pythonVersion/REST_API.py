# REST_API.py

import webapp2
from slips import Slip, SlipHandler  # NDB Database Model and HTTP Handlers
from boats import Boat, BoatHandler  # NDB Database Model and HTTP Handlers

# Main route handler.
class Main(webapp2.RequestHandler):
    def get(self):
        self.response.write("Hello REST API")
            
# Add patch as a http method.
allowed_methods = webapp2.WSGIApplication.allowed_methods
new_allowed_methods = allowed_methods.union(('PATCH',))
webapp2.WSGIApplication.allowed_methods = new_allowed_methods

# Set http routes.
app = webapp2.WSGIApplication([('/', Main),
			('/boats', BoatHandler),
			('/boats/(.*)', BoatHandler),                        
			('/slips/?(.*)', SlipHandler)],
			debug=True)
    
