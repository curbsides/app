# Curbsides

## Inspiration
While our cities provide five public parking spaces per car, drivers waste an average of 17 hours of their year searching for spots and lose a collective $73 billion annually. This is the absurdity of urban parking in America. One-third of cars on residential streets are hunting for these spots—impeding walkability and emergency response, which relies on surface streets the most. 
In fewer words: this is expensive, inefficient, and just plain dangerous.

"Curbsides" harnesses the increasing prevalence of vehicle sensor data to make our urban centers work better for everyone.

## What it does

Curbsides is a smart urban parking solution that transforms the parking experience through real-time data analysis:

- **Search**: Users can input their destination or use their current location to initiate a parking search
- **Real-time Availability**: Our system performs proximity searches for empty curbside parking using our custom-trained visual transformer model
- **Visual Navigation**: The app displays multiple nearby open spots on an interactive map, with the nearest spot pre-selected
- **Precision View**: A detailed overlay provides users with a clear view of their parking destination, eliminating guesswork

## How we built it

We developed Curbsides using a sophisticated tech stack that combines machine learning with modern web technologies:

- **Model Architecture**: Implemented a visual transformer model in PyTorch that converts parking spot images into binary classifications
- **Data Processing**: Created a custom pipeline to process and geo-tag image data
- **Frontend**: Built an intuitive user interface using modern web technologies and integrated with Mapbox API
- **Backend**: Developed a robust API system to handle real-time queries and model predictions
- **Deployment**: Utilized AWS EC2 for model hosting and S3 for efficient data management

## Challenges we ran into

Our development journey involved overcoming several significant technical challenges:

### Data Challenges
- Initially attempted to use Waymo perception data for segmentation
- Pivoted from BiSeNet pretrained model due to parking spot labeling difficulties
- Transitioned to BDD 100k dataset for geo-location capabilities
- Created custom labeling tools to address insufficient data labeling
- Managed data consistency issues through careful preprocessing

### Technical Hurdles
- Encountered deployment limitations with the 1GB model on Heroku
- Solved deployment issues by migrating to AWS EC2 with adequate RAM and GPU resources
- Implemented complex user location support in the frontend
- Optimized model performance for real-time predictions

## Accomplishments that we're proud of

- Successfully deployed a full-stack application with a live URL
- Developed and deployed a functioning machine learning model for real-time parking detection
- Created innovative solutions for data supplementation and processing
- Implemented seamless integration with mapping services for real-world applications

## What we learned

Our team gained valuable experience in:
- Practical machine learning implementation, including regularization techniques like dropout and backboning
- Dataset curation and the challenges of working with real-world data
- MapBox API integration for contextual data visualization
- AWS deployment strategies for machine learning models
- Iterative development and problem-solving in a complex system

## What's next for Curbsides

The future of Curbsides depends on achieving a critical mass of sensor-equipped vehicles implementing open standards for data collection and sharing.

Modern vehicles already have the sensors, and we're rapidly approaching a critical mass of sensor-enabled cars on our roads. The technology to revolutionize urban parking exists today. Through Curbsides, we hope to have demonstrated that efficient urban parking is more than a pipe dream.
