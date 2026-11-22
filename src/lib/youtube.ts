// YouTube links, video info and the IFrame player script. The link rules follow SongPlay's player.

const VIDEO_ID = /^[\w-]{11}$/;
const LIST_ID = /^[\w-]{12,}$/;
const HOSTS = new Set(["youtube.com", "youtu.be", "youtube-nocookie.com"]);

