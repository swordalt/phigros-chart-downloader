# Phigros Chart Downloader
###### Note: This project relies on [Phigros_Resource](https://github.com/7aGiven/Phigros_Resource) for assets, a repository not owned by me. There is a box telling you what version of the game the website has been updated to. Thanks!

This project allows you to explore Phigros assets by song (raw audio, illustrations, and chart files). You have the option to export assets individually, as a Phira/RPE compatible 'PEZ' file, or all in a 'ZIP' archive.

Use it here: https://swordalt.github.io/phigros-chart-downloader/

## Usage
Below are the features this project offers, as well as how to use them.

#### Export as Chart
This allows one to export a playable chart, that can be imported into Phira and RPE. You must select a difficulty first in the "Difficulty" table on the left.

#### Export All Assets
This allows one to export every asset for the selected song in a 'ZIP' archive.

#### Download Asset
This allows one to export a singular asset.

## URL Parameters
Below are the various URL parameters you can use to create a direct link for downloads.

'download' = What to download.
- 'chart', 'asset', 'all_assets'

'songID' = Song's internal ID.

#### Download Chart
'?download=chart&songID={}&difficulty={}'

'difficulty' = Difficulty
- 'ez', 'hd', 'in', 'at'

#### Download Singular Asset
'?download=asset&songID={}&type={}'

'type' = What asset.
- 'audio', 'illust', 'c_ez', 'c_hd', 'c_in', 'c_at'

Ex: https://swordalt.github.io/phigros-chart-downloader?download=asset&songID=QZKagoRequiem.tpazolite&type=audio
- Downloads audio of QZKago Requiem.

### Credits
[Phigros_Resource](https://github.com/7aGiven/Phigros_Resource), by [7aGiven](https://github.com/7aGiven)
- For providing decompiled assets and files.

[phichain](https://github.com/Ivan-1F/phichain), by [Ivan-1F](https://github.com/Ivan-1F)
- For phichain-converter, allowing legacy formats to be compatible with modern-day programs.

Phigros, by [Pigeon Games](https://space.bilibili.com/414149787)
- For the original game.
