import webapp2

# Main page handler.
class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.write("hello")
            
# Add patch as a http method.
allowed_methods = webapp2.WSGIApplication.allowed_methods
new_allowed_methods = allowed_methods.union(('PATCH',))
webapp2.WSGIApplication.allowed_methods = new_allowed_methods

# Set http routes.
app = webapp2.WSGIApplication([('/', MainPage)],
                              debug=True)
