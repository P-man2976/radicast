# Radicast

Radiko / NHKラジオ らじる★らじるの放送を HTTP による mp3 ストリーミングに変換します

## 使い方

```bash
❯ radicast --help     
オプション:
      --help     ヘルプを表示                                                     [真偽]
      --version  バージョンを表示                                                   [真偽]
  -p, --port     HTTP server port number                      [数値] [デフォルト: 8080]
```

### バイナリをダウンロードして使う

[https://github.com/P-man2976/radicast-pkg](https://github.com/P-man2976/radicast-pkg) に、各プラットフォーム向けの実行ファイルがあります。

### npx から使う

```bash
npx radicast
```

### グローバルインストールして使う

```bash
npm i -g radicast

# Execute without `npx`
radicast
```

## 各放送局へのパス

### `/nhk/*` - NHKラジオ らじる★らじる

### `/nhk/stations` - 放送局リスト

#### `/nhk/live/:areaId/:stationId` - ストリーミング

- `areaId` - 放送局

|  areaId   |       放送局        |
| :-------: | :-----------------: |
|  sapporo  |  札幌放送局 (JOIK)  |
|  sendai   |  仙台放送局 (JOHK)  |
|   tokyo   |  東京放送局 (JOAK)  |
|  nagoya   | 名古屋放送局 (JOCK) |
|   osaka   |  大阪放送局 (JOBK)  |
| hiroshima |  広島放送局 (JOFK)  |
| matsuyama |  松山放送局 (JOZK)  |
|  fukuoka  |  福岡放送局 (JOLK)  |

- `stationId` - 放送種別

| stationId |    種別    |
| :-------: | :--------: |
|   r1hls   | ラジオ第一 |
|   r2hls   | ラジオ第二 |
|   fmhls   |   NHK-FM   |

### `/radiko/*` - Radiko

#### `/radiko/stations/:areaId?` - 放送局リスト

- `areaId` - エリアコード

[https://api.radiko.jp/apparea/area](https://api.radiko.jp/apparea/area)のレスポンス中のspanタグに含まれるクラス名がエリアコードです。

### `/radiko/live/:stationId` - ストリーミング（周辺エリアのみ）

- `stationId` - 放送局コード

Radiko の各放送ページの URL から、各放送局のコードを確認することができます。

![URL中の放送局コード位置](./assets/radiko_url.png)

## Euro Truck Simulator 2 で使う

`radicast` を起動後、`live_streams.sii` 内に局リストを追加してください。

例：

- NHKラジオ第一 東京放送局
- NHKラジオ第二 東京放送局
- NHK-FM 東京放送局
- TOKYO FM
- J-WAVE
- NACK5

```text
SiiNunit
{
live_stream_def : _nameless.263.4698.8250 {
 stream_data: 194
 stream_data[0]: "http://localhost:8080/nhk/live/tokyo/r1hls|NHK Radio 1 Tokyo (JOAK)|Country|JP|0|0"
 stream_data[1]: "http://localhost:8080/nhk/live/tokyo/r2hls|NHK Radio 2 Tokyo (JOAB)|Education|JP|0|0"
 stream_data[2]: "http://localhost:8080/nhk/live/tokyo/fmhls|NHK-FM Tokyo (JOAK-FM)|Country|JP|0|0"
 stream_data[3]: "http://localhost:8080/radiko/live/FMT|TOKYO FM (JOAU-FM)||JP|0|0"
 stream_data[4]: "http://localhost:8080/radiko/live/FMJ|J-WAVE (JOAV-FM)|Music|JP|0|0"
 stream_data[5]: "http://localhost:8080/radiko/live/NACK5|NACK5 (JODV-FM)||JP|0|0"

 ...other stations...
}
}
```
