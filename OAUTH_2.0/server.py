import os
import json
import jinja2
import webapp2
import urllib
import google.appengine.api.urlfetch as urlfetch

# config jinja2 environment
JINJA_ENVIRONMENT = jinja2.Environment(
    loader = jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

# Client app's id, state (ie secret)
CLIENT_SECRET = 
CLIENT_ID = 

# Apps main URL
APP_URL = 

# URL where End User is redirected after obtaining authorization code and the original client state (secret) 
END_USER_REDIRECT_URL = APP_URL + "/oauth"

# URL where Client sends authorization code and state in exchange for token
GOOGLE_OAUTH_REQ_URL = 

# URL where the Client uses token to access End User's data
GOOGLE_PLUS_URL = 

#
# ROUTE HANDLERS
# 
#

# Main Handler
#		- Server creates the login URL based on id (CLIENT_ID), state(SuperSecret9000), scope (email) and the redirect (END_USER_REDIRECT_URL)
#			- Send created URL to jinja2 template to be used via OAUTH button press by End User




# OPTIONAL PATCH METHOD ENABLER
allowed_methods = webapp2.WSGIApplication.allowed_methods
new_allowed_methods = allowed_methods.union(('PATCH',))
webapp2.WSGIApplication.allowed_methods = new_allowed_methods

# Set http routes.
app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/about-me', AboutHandler),
                               ('/oauth', OauthHandler),
                               ('/.*', NotFoundHandler)],
                              debug=True)
