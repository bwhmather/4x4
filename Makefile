PYTHON ?= python

TEXTURE_SOURCES := $(wildcard img-src/*.xcf)
TEXTURES := $(patsubst img-src/%.xcf,www/img/%.png,$(TEXTURE_SOURCES))

OUTPUT_DIRS := www/img

.PHONY: all
all: $(TEXTURES)

$(TEXTURES) : www/img/%.png : img-src/%.xcf www/img
	$(PYTHON) ./xcf2png.py $< $@

$(OUTPUT_DIRS):
	mkdir -p $@

clean:
	rm -f $(TEXTURES)
