SLD = $(wildcard *.xml)
HTML = $(SLD:.xml=.html)

all: $(HTML) index.html

%.html: %.xml
	../../bin/SLDtoHTML.py -s $< > $@

index.html: $(SLD)
	../../bin/sld_index.py > index.html

clean:
	rm -f *.html
