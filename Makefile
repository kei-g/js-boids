NPM      = npm
NPMFLAGS = --silent
RM       = rm -f
TARGET   = boids.js

all: $(TARGET)

clean:
	$(RM) $(TARGET)

.PHONY: clean

$(TARGET):
	$(NPM) run build $(NPMFLAGS)
