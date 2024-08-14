<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Match Words</title>
</head>
<body>
    <h1>Match Word Lists</h1>
    <div>
    <?php
        include_once __DIR__ . "/../lib/makeWordArray.php";
        include_once __DIR__ . "/../lib/matchWordLists.php";

        $includeChars = "\\\'\\\-";

        $wordsB = ["the", "holy", "man", "with", "the", "cow", "nworb", "came", "to", "the", "brown", "cows"];
        $wordsA = ["the", "brown", "cow"];
        $baseScore = 1;
        $score = matchWordLists($wordsA, $wordsB, $baseScore);
        echo "<p>Score: {$score}</p>";

        $includeChars = "\\\'\\\-";
        $sentence = "the holy man, o'brians, with the cow nworb came to the brown cows";
        $wordsB = makeWordArray($sentence, $includeChars);
        foreach ($wordsB as $word) {
            echo "&emsp;{$word}<br>";
        }
        $searchItem = "the brown cow";
        $wordsA = makeWordArray($searchItem, $includeChars);

        $baseScore = 1;
        $score = matchWordLists($wordsA, $wordsB, $baseScore);
        echo "<p>Score: {$score}</p>";

    ?>
    </div>
</body>
</html>