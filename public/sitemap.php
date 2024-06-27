<?php 
header("Content-type: text/xml");
echo '<?xml version="1.0" encoding="UTF-8" ?>';
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.gloomy-store.com/</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>never</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/#!</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>never</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/board/index.php?module_srl=214&amp;view_all=0</loc>
    <lastmod>2022-06-07</lastmod>https://www.gloomy-store.com/
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/board/index.php?module_srl=52&amp;view_all=0</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/board/index.php?module_srl=52</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/board/index.php?module_srl=214</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.gloomy-store.com/board/index.php?module_srl=214#!</loc>
    <lastmod>2022-06-07</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>';

include $_SERVER['DOCUMENT_ROOT']."/connect/db_connect.php";
$sql = "SELECT * FROM xe_documents WHERE status='PUBLIC' ORDER BY regdate DESC";
$sql_get = mysqli_query($dbConn, $sql);
while($row = mysqli_fetch_array($sql_get)){
	$url = "https://www.gloomy-store.com/board/".$row['module_srl']."/document/".$row['document_srl'];
	
	$date = substr( $row['regdate'], 0, 4 )."-".substr( $row['regdate'], 4, 2 )."-".substr( $row['regdate'], 6, 2 );
	if($row['module_srl'] === '52'){
		$category = 'development';
	} else if($row['module_srl'] === '214'){
		$category = 'daily';
	}
	$changefreq = 'daily';
	$priority = 0.8;

  echo "<url>
    <loc>$url</loc>
    <lastmod>$date</lastmod>
    <changefreq>$changefreq</changefreq>
    <priority>$priority</priority>
    <category>$category</category>
  </url>";}

echo "</urlset>";
?>