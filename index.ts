import html2pdf from 'html2pdf.js';

type Side = 'p' | 'd';
type StatementType = 'Open' | 'Close';
type IndividualAwardsType = 'aty' | 'wit';

interface Performance {
  role: string;
  name: string;
  score: number;
  comments: number;
  side: Side;
}

function generatePerformanceHtml(performance: Performance) {
  const { role, name, score, comments, side } = performance;
  return `<div style="background:${side === 'd' ? 'rgb(230, 231, 233)' : ''};padding:5px">${role} (${name}) <b>${score}</b><br/><i>${comments}</i></div>`;
}

function generateSectionHtml(title: string, bodyHtml: string) {
  return `<span style="font-weight: bold; color: darkblue;">${title}</span>${bodyHtml}<hr />`;
}

function generatePerformancesSectionHtml(title: string, performances: Performance[]) {
  const performancesHtml = performances.map(generatePerformanceHtml);
  return generateSectionHtml(title, performancesHtml.join(''));
}


function generateStatementSectionHtml(statement: StatementType, ballot: any) {
  const header = `${statement}ing`;
  
  const plaintiff: Performance = {
    role: `π ${statement}}`,
    name: ballot[`p${statement}Attorney`],
    score: ballot[`p${statement}`],
    comments: ballot[`p${statement}Comments`],
    side: 'p',
  };
  const defense: Performance = {
    role: `∆ ${statement}}`,
    name: ballot[`p${statement}Attorney`],
    score: ballot[`p${statement}`],
    comments: ballot[`p${statement}Comments`],
    side: 'p',
  };

  return generatePerformancesSectionHtml(header, [plaintiff, defense]);
}

function generateIndividualAwardsHtml(ballot: any) {
  let html = '<ol>';
  for (let i = 1; i <= 4; i++) {
    html += `<li>${ballot[`${category}${i}`]}</li>`;
  }
  html += '</ol>';
  return generateSectionHtml('Individual Awards');
}

function generateBallotHtml(ballot: any) {
  let html = '';

  const totalScores = {
    p: 0,
    d: 0,
  }

  html += generateStatementSectionHtml('Open', ballot);

  for (let side = 1; side <= 2; side++) {
    const [dx, cx]: [Side, Side] = side === 1 ? ['p', 'd'] : ['d', 'p'];
    const sideName = side === 1 ? 'Plaintiff' : 'Defense';
    for (let i = 1; i <= 3; i++) {
      const witnessCharacter = ballot[`witness${side * i}`]; // witnesses are stored witness1, 2, 3, 4, 5, 6
      const header = `${sideName} Witness ${i} (${witnessCharacter})`;
      const direct = {
        role: 'Aty Dx',
        name: ballot[`${dx}Dx${i}Attorney`],
        score: ballot[`${dx}Dx${i}`],
        comments: ballot[`${dx}Dx${i}Comments`],
        side: dx,
      };
      const cross = {
        role: 'Aty Cx',
        name: ballot[`${cx}Cx${i}Attorney`],
        score: ballot[`${cx}Cx${i}`],
        comments: ballot[`${cx}Cx${i}Comments`],
        side: cx,
      };
      const witnessDirect = {
        role: 'Wit Dx',
        name: ballot[`${dx}WDx${i}Witness`],
        score: ballot[`${dx}WDx${i}`],
        comments: ballot[`${dx}WDx${i}Comments`],
        side: dx,
      };
      const witnessCross = {
        role: 'Wit Cx',
        name: ballot[`${dx}WDx${i}Witness`],
        score: ballot[`${dx}WCx${i}`],
        comments: ballot[`${dx}WCx${i}Comments`],
        side: dx,
      };

      totalScores[dx] += direct.score + witnessDirect.score + witnessCross.score;
      totalScores[cx] += cross.score;

      html += generatePerformancesSectionHtml(header, [direct, cross, witnessDirect, witnessCross]);
    }
  };

  html += generateStatementSectionHtml('Close', ballot);
  html += generateIndividualAwardsHtml('aty', ballot);
  html += generateIndividualAwardsHtml('wit', ballot);
  
  const winner = totalScores.p > totalScores.d ? 'Plaintiff' : 'Defense';
  const pointDifference = Math.abs(totalScores.p - totalScores.d);
  const result = totalScores.p === totalScores.d ? 'Tie' : `${winner} wins +${pointDifference}`;

  return `<h2>Round ${ballot.round} (${ballot.judge}) - ${result}</h1>${html}`;
}

function generateAllBallots() {
  const id = parseInt(prompt('Please enter your team ID:'));

  if (isNaN(id)) {
    alert('Please try again with a valid ID');
  }

  const ballots = JSON.parse(document.querySelector('script:not([src])').textContent.split('var ballots =')[1]);
  const teamBallots = ballots.filter(ballot => ballot.dNumber === parseInt(id) || ballot.pNumber === parseInt(id));

  if (!teamBallots.length) {
    alert(`Cannot find ballots for team ${teamBallots}`);
  }

  return generateBallotHtml(teamBallots[6]);
}

function main() {
  const html = generateAllBallots();
  const element = document.createElement('div');
  element.innerHTML = html;
  html2pdf().from(element).set({
    pagebreak: { mode: 'avoid-all' },
    margin: 5,
  }).save();
  
}

main();