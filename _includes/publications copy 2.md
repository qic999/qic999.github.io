<h2 id="publications" style="margin: 2px 0px -15px;">Publications</h2>

<div class="publications">
  <div class="main-content">
    <div class="main-more-container">
      <div id="main-pub-container">
        <!-- <h5 class="subtitle">Publications
          (
          <a id="publication-by-selected" href="javascript:;" onClick="publicationBySelected();">show selected</a> /
          <a id="publication-by-topic" href="javascript:;" onClick="publicationByTopic();">show all by topic</a> /
          <a id="publication-by-date" href="javascript:;" onClick="publicationByDate();">show all by date</a>
          )
        </h5> -->
        <p class="subtitle-aux">
          <span class="bold">Topics:</span>
          <a href="#topic-bio" onClick="return publicationByTopicSpecific(this)" data-topic="bio">Biological Imaging</a> /
          <a href="#topic-med" onClick="return publicationByTopicSpecific(this)" data-topic="med">Medical Imaging</a> /
          <a href="#topic-cv" onClick="return publicationByTopicSpecific(this)" data-topic="cv">Computer Vision</a>
          <span class="note">(*: indicates equal contribution.)</span>
        </p>
        <div id="main-pub-card-container" class="activated hide">
          {% for link in site.data.publications.main %}
          <div class="pub-card" data-topic="{{ link.topic }}" data-year="{{ link.year }}" data-selected="{{ link.selected }}"> 
            <div class="pub-row">
              <div class="col-sm-3 abbr" style="position: relative; padding-right: 15px; padding-left: 15px;">
                {% if link.image %}
                  <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width: 100%; height: 40%;">
                  {% if link.conference_short %}
                    <abbr class="badge">{{ link.conference_short }}</abbr>
                  {% endif %}
                {% endif %}
              </div>
              <div class="pub-card-body">
              <div class="col-sm-9" style="position: relative; padding-right: 15px; padding-left: 20px;">
                <div class="title"><a href="{{ link.pdf }}">{{ link.title }}</a></div>
                <div class="author">{{ link.authors }}</div>
                <div class="periodical"><em>{{ link.conference }}</em></div>
                <div class="links">
                  {% if link.pdf %}
                    <a href="{{ link.pdf }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">PDF</a>
                  {% endif %}
                  {% if link.code %}
                    <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Code</a>
                  {% endif %}
                  {% if link.page %}
                    <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Project Page</a>
                  {% endif %}
                  {% if link.bibtex %}
                    <a href="{{ link.bibtex }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">BibTex</a>
                  {% endif %}
                  {% if link.notes %}
                    <strong><i style="color:#e74d3c">{{ link.notes }}</i></strong>
                  {% endif %}
                  {% if link.others %}
                    {{ link.others }}
                  {% endif %}
                </div>
                </div>
              </div>
            </div>
          </div>
          {% endfor %}
        </div>
      </div>
    </div>
  </div>
</div>
