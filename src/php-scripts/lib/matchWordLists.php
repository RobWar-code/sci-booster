<?php
    /**
     * Get a score for match of wordsA in wordsB.
     * Use the base score as a 100% match of a single word.
     */
    function matchWordLists($wordsA, $wordsB, $baseScore) {
        // Initialise Flags
        $adjacentCount = 0;
        $adjacentScore = 0;
        $byOrderCount = 0;
        $byOrderScore = 0;
        $score = 0;
        $done = 0;
        $bIndex = 0;
        $lastByOrderMatch = -2;
        $lastAdjacentMatch = -2;
        $lastBIndex = -2;
        $lastAIndex = -2;
        $lastByOrderIndex = -2;
        foreach ($wordsB as $wordB) {
            $gotScore = -1;
            $aIndex = 0;
            $wordMaxScore = 0;
            foreach ($wordsA as $wordA) {
                $charMatch = similar_text($wordA, $wordB, $wordScore);
                echo "{$wordB} - {$wordScore} <br>";
                if ($wordScore > 75) {
                    $gotScore = $aIndex;
                    $foundScore = ($wordScore/100) * $baseScore;
                    if ($foundScore > $wordMaxScore) {
                        $wordMaxScore = $foundScore;
                    }
                    if ($lastBIndex === $bIndex - 1) {
                        if ($lastByOrderIndex === $aIndex - 1) {
                            $factor = 2;
                            $byOrderScore += $foundScore * $factor;
                            $lastByOrderIndex = $aIndex;
                            ++$byOrderCount;
                            echo "Matched byOrder - {$byOrderScore} - {$byOrderCount}<br>";
                        }
                        else {
                            if ($byOrderScore > $score) $score = $byOrderScore;
                            $byOrderScore = $foundScore;
                            $lastByOrderIndex = $aIndex;
                            $byOrderCount = 1;
                        }
                        if ($lastAIndex != $aIndex) {
                            $factor = 1.5;
                            $adjacentScore += $foundScore * $factor;
                            $lastAdjacentMatch = $aIndex;
                            ++$adjacentCount;
                            echo "Matched adjacent - {$adjacentScore} - {$adjacentCount}<br>";
                        }
                    }
                }
                ++$aIndex;
            }
            if ($gotScore >= 0) {
                $lastBIndex = $bIndex;
                if ($byOrderCount >= count($wordsA)) {
                    if ($byOrderScore > $score) {
                        $score = $byOrderScore;
                        $byOrderScore = 0;
                    }
                    $byOrderCount = 0;
                    $lastByOrderIndex = -2;
                }
                elseif ($lastByOrderIndex === -2) {
                    $lastByOrderIndex = $gotScore;
                    $byOrderCount = 1;
                    $byOrderScore = $foundScore;
                }
                if ($adjacentCount >= count($wordsA)) {
                    if ($adjacentScore > $score) {
                        $score = $adjacentScore;
                        $adjacentScore = 0;
                    }
                    $adjacentCount = 0;
                    $lastAIndex = -2;
                }
                elseif ($lastAIndex === -2) {
                    $lastAIndex = $aIndex;
                    $adjacentCount = 1;
                    $adjacentScore = $foundScore;
                }
                else {
                    $lastAIndex = $lastAdjacentIndex;
                }
                if ($wordMaxScore > $score) $score = $wordMaxScore;
            }
            else {
                if ($byOrderCount > 0) {
                    if ($byOrderScore > $score) $score = $byOrderScore;
                }
                if ($adjacentCount > 0) {
                    if ($adjacentScore > $score) $score = $adjacentScore;
                }
                $adjacentCount = 0;
                $byOrderCount = 0;
                $byOrderScore = 0;
                $adjacentScore = 0;
                $lastByOrderIndex = -2;
                $lastAIndex = -2;
                $lastBIndex = -2;                
            }
            ++$bIndex;
        }
        return $score;
    }