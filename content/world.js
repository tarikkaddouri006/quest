/* QUEST · content/world.js
   The issue, the explorer classes and every point on the map.
   To add a destination: add an entry to ZONES here, then a chapter with the same id in stories.js.
   See README.md. */
window.QUEST = window.QUEST || {};
(function (Q) {

Q.ISSUE = { lead: 'catalina', no: '01', label: 'Issue 01', season: 'Winter 2026', region: 'Pacific Northwest & California' };

/* Classes are a point of view, never a gate. `bonus` is a small XP affinity only. */
Q.CLASSES = {
  athlete: { n: 'Athlete', img: 'img/spear-ready.jpg', copy: 'Measures life in reps and miles, from the pitch to the reef.', st: { END: 8, FOC: 7, STY: 4, CRF: 3 }, bonus: ['Athletics', 'Adventure'], perk: 'Athletics and Adventure' },
  model: { n: 'Model', img: 'img/sf-hat.jpg', copy: 'Lives in front of the lens. Editorials, the look, and the story behind the shoot.', st: { STY: 9, FOC: 6, END: 4, CRF: 4 }, bonus: ['Fashion', 'Culture'], perk: 'Fashion and Culture' },
  design: { n: 'Design Enthusiast', img: 'img/cabin.jpg', copy: 'Here for the craft: the tool, the maker, the process behind the object.', st: { CRF: 9, STY: 6, FOC: 5, END: 3 }, bonus: ['Design', 'Culinary'], perk: 'Design and Culinary' }
};
Q.STATN = { END: 'Endurance', STY: 'Style', CRF: 'Craft', FOC: 'Focus' };
Q.SKINS = ['#E9E6DF', '#B9B5AD', '#6E6B66', '#2B2A28'];
Q.SKIN_NAMES = ['Bone', 'Stone', 'Graphite', 'Onyx'];
Q.HCOL = ['#17120F', '#5A3A22', '#C9A26B', '#8E8E8E'];
Q.LV = [0, 150, 400, 750, 1200, 1800, 2600, 3600];

/* ZONES
   status : 'published'  a chapter you can read now
            'territory'  announced, not yet written. Shows a teaser only. Flip to 'published' when the chapter ships.
   ll     : [lat, lon]   el: elevation label   tz: IANA zone (drives the local time on the map)
   scene  : soundscape key (js/sound.js)       mark: index of the glyph in js/relics.js
   tag    : what kind of piece it is           line: one sentence of identity, taken from the chapter's own verdict
   lab    : [dx, dy, anchor] label offset on the map */
Q.ZONES = {
  portland:    { region: 'Pacific Northwest', status: 'published', n: 'Quest HQ', sub: 'Portland, Oregon', ll: [45.5152, -122.6784], el: '50 ft', tz: 'America/Los_Angeles', scene: 'hq', mark: 13, tag: 'Home base · manifesto', line: 'Every journey starts and ends here.', lab: [0, -17, 'middle'] },
  silverfalls: { region: 'Pacific Northwest', status: 'published', n: 'Silver Falls', sub: 'Silver Falls State Park, OR', ll: [44.8784, -122.6531], el: '1,200 ft', tz: 'America/Los_Angeles', scene: 'falls', mark: 23, tag: 'Essay · film', line: 'The trail goes behind the water.', lab: [-15, 4, 'end'] },
  trillium:    { region: 'Pacific Northwest', status: 'published', n: 'Trillium Lake', sub: 'Mt. Hood National Forest, OR', ll: [45.2694, -121.7389], el: '3,600 ft', tz: 'America/Los_Angeles', scene: 'wind', mark: 5, tag: 'Photo essay · night', line: 'You can’t book it. You can only be ready, and be here.', lab: [15, 4, 'start'] },
  eugene:      { region: 'Pacific Northwest', status: 'published', n: 'Autzen Stadium', sub: 'Eugene, Oregon', ll: [44.0582, -123.0687], el: '430 ft', tz: 'America/Los_Angeles', scene: 'stadium', mark: 10, tag: 'Film · culture', line: 'At Autzen you can hear it before the first drill.', lab: [-15, 4, 'end'] },
  catalina:    { region: 'California', status: 'published', n: 'Catalina', sub: 'Santa Catalina Island, CA', ll: [33.3879, -118.4163], el: 'Sea level', tz: 'America/Los_Angeles', scene: 'ocean', mark: 17, tag: 'Film · field journal', line: 'A classic sloop, a speargun and a cove with nobody in it.', lab: [15, 4, 'start'] },
  coast:       { region: 'Pacific Northwest', status: 'published', n: 'Oregon Coast', sub: 'North Coast, Oregon', ll: [45.75, -123.96], el: 'Sea level', tz: 'America/Los_Angeles', scene: 'ocean', mark: 18, tag: 'Field guide · food', line: 'Low tide, a cast-iron pan and a fire ring on the sand.', lab: [-15, 4, 'end'] },
  shanghai:    { region: 'Asia', status: 'published', n: 'Shanghai', sub: 'The Bund, Shanghai', ll: [31.2400, 121.4900], el: '13 ft', tz: 'Asia/Shanghai', scene: 'city', mark: 20, tag: 'Photo essay · city', line: 'For an hour at dawn the riverfront is yours.', lab: [15, 4, 'start'] },
  troutlake:   { region: 'Pacific Northwest', status: 'published', n: 'Trout Lake', sub: 'Trout Lake, Washington', ll: [45.9973, -121.5281], el: '1,950 ft', tz: 'America/Los_Angeles', scene: 'forest', mark: 24, tag: 'Slow essay · film', line: 'Come for the quiet, go underground for the story.', lab: [15, 4, 'start'] },
  astoria:     { region: 'Pacific Northwest', status: 'territory', n: 'Astoria', sub: 'Oregon', ll: [46.1879, -123.8313], el: '20 ft', tz: 'America/Los_Angeles', scene: 'ocean', mark: 14, lab: [-13, 4, 'end'] },
  tokyo:       { region: 'Asia', status: 'territory', n: 'Tokyo', sub: 'Japan', ll: [35.6762, 139.6503], el: '130 ft', tz: 'Asia/Tokyo', scene: 'city', mark: 15, lab: [13, 4, 'start'] }
};

Q.TRAVEL = { shanghai: 'Fly into Shanghai Pudong (PVG). The Bund runs along the west bank of the Huangpu River.', troutlake: 'Columbia River Gorge to White Salmon, then north toward Mount Adams. About 2 hr from Portland.', portland: 'Home base.', silverfalls: 'South of Portland, in the Cascade foothills.', trillium: 'US-26 east from Portland, about 1 hr 20 min.', eugene: 'I-5 south to Eugene.', catalina: 'Ferry from Long Beach (about 1 hr) or San Pedro (about 1 hr 10 min).', coast: 'US-26 west from Portland, about 1 hr 30 min to the north coast.', astoria: 'Where the Columbia meets the Pacific.', tokyo: 'Across the Pacific.' };

/* Reference cities: [name, lat, lon, dx, dy, anchor]. Not destinations. */
Q.CITIES = [['Los Angeles', 34.05, -118.24, -8, 4, 'end'], ['Seattle', 47.61, -122.33, 8, 4, 'start'], ['San Francisco', 37.77, -122.42, 8, 4, 'start']];

})(window.QUEST);
