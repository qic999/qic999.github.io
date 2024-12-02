<h2 id="publications" style="margin: 2px 0px -15px;">Publications
(
  <span class="filters">
        <a id="filter-selected" onclick="applyFilter(this, showSelected)">Selected</a> /
        <a onclick="applyFilter(this, showByDate)">All</a>
  </span>
)
</h2>



<div class="publications">
<ol class="bibliography">

<td style="padding-top:0px;padding-bottom:2px;width:100%;vertical-align:middle">
  <p><em>(* indicates equal contribution)</em></p>
  <p><span class="filters" id="research-topics">
  <strong>Research Topics:</strong>
      <a onclick="applyFilter(this, filterByTopic('med'))">Medical Imaging</a> / 
      <a onclick="applyFilter(this, filterByTopic('bio'))">Biological Imaging</a> / 
      <a onclick="applyFilter(this, filterByTopic('cv'))">Computer Vision</a>
  </span></p>
</td>


<table style="width:100%;border:0px;border-spacing:0px;border-collapse:collapse;margin-right:auto;margin-left:auto;" id="publicationsTable">
  <tbody>
  {% for link in site.data.publications.main %}
  <tr class="bottom-line publication" data-topic="{{ link.topic }}" data-year="{{ link.year }}" data-selected="{{ link.selected }}" >
    <li>
      <div class="pub-row" >
        <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
          {% if link.image %} 
          <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
          {% if link.conference_short %} 
          <abbr class="badge">{{ link.conference_short }}</abbr>
          {% endif %}
          {% endif %}
        </div>
        <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
            <div class="title"><a href="{{ link.pdf }}">{{ link.title }}</a></div>
            <div class="author">{{ link.authors }}</div>
            <div class="periodical"><em>{{ link.conference }}</em>
            </div>
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
            <strong> <i style="color:#e74d3c">{{ link.notes }}</i></strong>
            {% endif %}
            {% if link.others %} 
            {{ link.others }}
            {% endif %}
          </div>
        </div>
      </div>
    </li>
    <br>
  </tr>
  {% endfor %}

</tbody>
</table>

</ol>
</div>
