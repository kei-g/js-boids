RM       = rm -f
TARGET   = boids.js
TSC      = tsc
TSCFLAGS = -P tsconfig.json

all: $(TARGET)

clean:
	$(RM) $(TARGET)

.PHONY: clean

$(TARGET):
	$(TSC) $(TSCFLAGS)
