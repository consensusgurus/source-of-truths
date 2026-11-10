// The guess list for Resume: famous people a player may name. Every answer in
// app/resume/puzzles.js is here (scripts/verify-resume.mjs checks), along with
// plenty of near neighbours (founders, chief executives, investors, athletes,
// actors, politicians, judges) so a list of names never narrows the answer.
// A typed name that is not here costs nothing.
const NAMES = [
  // business: founders and chief executives
  'Warren Buffett', 'Charlie Munger', 'Greg Abel', 'Jensen Huang', 'Lisa Su', 'Pat Gelsinger', 'Andy Grove', 'Gordon Moore',
  'Satya Nadella', 'Steve Ballmer', 'Bill Gates', 'Paul Allen', 'Sundar Pichai', 'Larry Page', 'Sergey Brin', 'Eric Schmidt',
  'Susan Wojcicki', 'Marissa Mayer', 'Sheryl Sandberg', 'Mark Zuckerberg', 'Jeff Bezos', 'Andy Jassy', 'MacKenzie Scott',
  'Elon Musk', 'Peter Thiel', 'Reid Hoffman', 'Tim Cook', 'Steve Jobs', 'Steve Wozniak', 'Jony Ive', 'Larry Ellison',
  'Safra Catz', 'Michael Dell', 'Meg Whitman', 'Carly Fiorina', 'Ginni Rometty', 'Arvind Krishna', 'Sam Altman', 'Dario Amodei',
  'Demis Hassabis', 'Mustafa Suleyman', 'Jack Dorsey', 'Evan Spiegel', 'Brian Chesky', 'Travis Kalanick', 'Dara Khosrowshahi',
  'Reed Hastings', 'Ted Sarandos', 'Bob Iger', 'Michael Eisner', 'Walt Disney', 'Howard Schultz', 'Brian Niccol',
  'Indra Nooyi', 'Ramon Laguarta', 'Mary Barra', 'Jim Farley', 'Lee Iacocca', 'Henry Ford', 'Alan Mulally', 'Akio Toyoda',
  'Jamie Dimon', 'Jane Fraser', 'Lloyd Blankfein', 'David Solomon', 'Ray Dalio', 'Ken Griffin', 'Stephen Schwarzman',
  'Larry Fink', 'Carl Icahn', 'Bill Ackman', 'George Soros', 'Michael Bloomberg', 'Abigail Johnson', 'Cathie Wood',
  'Peter Lynch', 'John Bogle', 'Benjamin Graham', 'Sara Blakely', 'Whitney Wolfe Herd', 'Arianna Huffington', 'Martha Stewart',
  'Ina Garten', 'Rachael Ray', 'Oprah Winfrey', 'Phil Knight', 'Mark Parker', 'Richard Branson', 'Jack Ma', 'Masayoshi Son',
  'Ratan Tata', 'Mukesh Ambani', 'Gautam Adani', 'Bernard Arnault', 'Francoise Bettencourt Meyers', 'Amancio Ortega',
  'Ingvar Kamprad', 'Sam Walton', 'Doug McMillon', 'Jeff Weiner', 'Ryan Roslansky', 'Daniel Ek',
  'Mark Cuban', 'Kevin O\'Leary', 'Barbara Corcoran', 'Lori Greiner', 'Daymond John', 'Robert Herjavec', 'Kevin Harrington',
  'Jeff Lawson', 'Marc Benioff', 'Marc Andreessen', 'Ben Horowitz', 'Vinod Khosla', 'John Doerr', 'Tony Hsieh',
  'Steve Case', 'Jerry Yang', 'David Filo', 'Pierre Omidyar', 'Jeff Skoll', 'Elizabeth Holmes', 'Adam Neumann',
  'Sam Bankman-Fried', 'Martin Shkreli', 'Jack Welch', 'Jeff Immelt', 'Lou Gerstner', 'Ursula Burns', 'Rosalind Brewer',
  'Thasunda Brown Duckett', 'Ken Chenault', 'Robert F. Smith', 'Herb Kelleher', 'Fred Smith', 'Ray Kroc', 'Dave Thomas',
  'Colonel Sanders', 'Milton Hershey', 'Estee Lauder', 'Coco Chanel', 'Ralph Lauren', 'Tory Burch', 'Vera Wang',
  'Kylie Jenner', 'Kim Kardashian', 'Rihanna', 'Jessica Alba', 'Gwyneth Paltrow', 'Reese Witherspoon', 'Ryan Reynolds',
  'George Clooney', 'Jay-Z', 'Diddy', 'Dr. Dre', 'Kanye West', 'Magic Johnson', 'Michael Jordan', 'Shaquille O\'Neal',
  'LeBron James', 'Kobe Bryant', 'Tom Brady', 'Serena Williams', 'Venus Williams', 'Tiger Woods', 'David Beckham',
  'Peyton Manning', 'Derek Jeter', 'Alex Rodriguez', 'Kareem Abdul-Jabbar', 'Charles Barkley', 'Dwyane Wade',
  // entertainment
  'Dwayne Johnson', 'John Cena', 'Hulk Hogan', 'Arnold Schwarzenegger', 'Sylvester Stallone', 'Jean-Claude Van Damme',
  'Vin Diesel', 'Jason Momoa', 'Kevin Hart', 'Will Smith', 'Tom Hanks', 'Tom Cruise', 'Matthew McConaughey', 'Brad Pitt',
  'Leonardo DiCaprio', 'Denzel Washington', 'Morgan Freeman', 'Meryl Streep', 'Julia Roberts', 'Sandra Bullock',
  'Jennifer Aniston', 'Jennifer Lopez', 'Beyonce', 'Taylor Swift', 'Dolly Parton', 'Madonna', 'Lady Gaga', 'Ellen DeGeneres',
  'Jimmy Fallon', 'Jimmy Kimmel', 'Stephen Colbert', 'Conan O\'Brien', 'David Letterman', 'Jay Leno', 'Johnny Carson',
  'Barbara Walters', 'Katie Couric', 'Diane Sawyer', 'Gayle King', 'Robin Roberts', 'Tyra Banks', 'Steve Harvey',
  'Ryan Seacrest', 'Simon Cowell', 'Howard Stern', 'Joe Rogan', 'Tyler Perry', 'Shonda Rhimes', 'Steven Spielberg',
  'George Lucas', 'Martin Scorsese', 'Quentin Tarantino', 'Spike Lee', 'Gordon Ramsay', 'Anthony Bourdain', 'Guy Fieri',
  'Julia Child', 'Wolfgang Puck', 'Emeril Lagasse', 'Bobby Flay', 'Chip Gaines', 'Joanna Gaines', 'Marie Kondo',
  // politics, law and public life
  'Michelle Obama', 'Barack Obama', 'Hillary Clinton', 'Bill Clinton', 'Laura Bush', 'George W. Bush', 'Jill Biden',
  'Joe Biden', 'Kamala Harris', 'Melania Trump', 'Donald Trump', 'Nancy Reagan', 'Ronald Reagan', 'Jacqueline Kennedy',
  'Eleanor Roosevelt', 'Condoleezza Rice', 'Colin Powell', 'Madeleine Albright', 'John Kerry', 'Henry Kissinger',
  'Mike Pompeo', 'Antony Blinken', 'Ruth Bader Ginsburg', 'Sandra Day O\'Connor', 'Sonia Sotomayor', 'Elena Kagan',
  'Amy Coney Barrett', 'Ketanji Brown Jackson', 'Clarence Thomas', 'John Roberts', 'Antonin Scalia', 'Thurgood Marshall',
  'Anthony Kennedy', 'Stephen Breyer', 'Samuel Alito', 'Neil Gorsuch', 'Brett Kavanaugh', 'Merrick Garland',
  'Nancy Pelosi', 'Mitch McConnell', 'Bernie Sanders', 'Elizabeth Warren', 'Alexandria Ocasio-Cortez', 'Pete Buttigieg',
  'Gavin Newsom', 'Jerry Brown', 'Michael Bloomberg', 'Rudy Giuliani', 'Andrew Cuomo', 'Mitt Romney', 'John McCain',
  'Al Gore', 'Dick Cheney', 'Mike Pence', 'JD Vance', 'Marco Rubio', 'Ted Cruz', 'Nikki Haley', 'Ron DeSantis',
  'Janet Yellen', 'Ben Bernanke', 'Alan Greenspan', 'Jerome Powell', 'Larry Summers', 'Christine Lagarde', 'Mark Carney',
  'Malala Yousafzai', 'Jane Goodall', 'Melinda French Gates', 'Laurene Powell Jobs', 'Priscilla Chan',
  // science and space
  'Neil deGrasse Tyson', 'Bill Nye', 'Carl Sagan', 'Stephen Hawking', 'Sally Ride', 'Neil Armstrong', 'Buzz Aldrin',
  'Richard Branson', 'Jeff Bezos', 'Tim Berners-Lee', 'Grace Hopper', 'Katherine Johnson',
];
export const UNIVERSE = [...new Set(NAMES)];
