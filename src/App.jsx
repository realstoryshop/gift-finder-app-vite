import React, { useState, useCallback } from 'react';

// Reusable Input/Select Component
const DynamicInput = ({ id, value, onChange, placeholder, options, disabled, type = 'text', textClass = 'text-[#9acbdb]', borderClass = 'border-[#477d8f]', focusBorderClass = 'focus:border-[#2c82c9]', extraClasses = '' }) => {
    const baseClasses = `bg-transparent border-b-2 ${borderClass} ${textClass} text-center focus:outline-none ${focusBorderClass} pb-1 text-3xl md:text-4xl font-extrabold ${extraClasses}`;

    if (options) {
        return (
            <select
                id={id}
                className={`${baseClasses} appearance-none cursor-pointer avenir-font`}
                value={value}
                onChange={onChange}
                disabled={disabled}
            >
                <option value="" className="bg-white text-[#9acbdb]">{placeholder}</option>
                {options.sort().map(opt => (
                    <option key={opt} value={opt.toLowerCase()} className="bg-white text-[#9acbdb]">{opt}</option>
                ))}
            </select>
        );
    }
    return (
        <input
            type={type}
            id={id}
            className={`${baseClasses}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
        />
    );
};

// Reusable Button Component
const ActionButton = ({ onClick, disabled, isLoading, children, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 text-sm font-bold py-1.5 px-4 rounded-lg shadow-lg uppercase tracking-wider
                   transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-75
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
    >
        {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : (
            children
        )}
    </button>
);

// Main App component
const App = () => {
    // State for gift criteria
    const [interests, setInterests] = useState('');
    const [notableEvents, setNotableEvents] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [relationship, setRelationship] = useState('');
    const [occasion, setOccasion] = useState('');

    // State for app functionality
    const [giftIdeas, setGiftIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cardMessage, setCardMessage] = useState('');
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

    // New states for history functionality
    const [giftIdeasHistory, setGiftIdeasHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Amazon Associate Tag
    const AMAZON_ASSOCIATE_TAG = 'realstory-20';

    // Unified handler for numeric inputs (age, minPrice, maxPrice)
    const handleNumericInputChange = useCallback((setter) => (e) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        setter(numericValue);
    }, []);

    // Handlers for specific inputs
    const handleInterestsChange = useCallback((e) => setInterests(e.target.value), []);
    const handleNotableEventsChange = useCallback((e) => setNotableEvents(e.target.value), []);
    const handleAgeChange = handleNumericInputChange(setAge);
    const handleMinPriceChange = handleNumericInputChange(setMinPrice);
    const handleMaxPriceChange = handleNumericInputChange(setMaxPrice);
    const handleGenderChange = useCallback((e) => setGender(e.target.value), []);
    const handleRelationshipChange = useCallback((e) => setRelationship(e.target.value), []);
    const handleOccasionChange = useCallback((e) => setOccasion(e.target.value), []);

    /**
     * Determines the correct article ("a" or "an") based on a word.
     * @param {string} word - The word to check.
     * @returns {string} "a" or "an".
     */
    const getArticle = useCallback((word) => {
        if (!word) return 'a';
        const firstChar = word.trim().toLowerCase().charAt(0);
        return ['a', 'e', 'i', 'o', 'u'].includes(firstChar) ? 'an' : 'a';
    }, []);

    /**
     * Processes a given URL, converting product links to search queries for specific retailers
     * and adding Amazon affiliate tags where applicable.
     * @param {string} originalLink - The original product or search URL.
     * @param {string} giftName - The name of the gift to use as a search term.
     * @returns {string} The processed URL (search link with affiliate tag for Amazon, or generic search for others).
     */
    const processRetailerLink = useCallback((originalLink, giftName) => {
        if (typeof originalLink !== 'string' || !originalLink.trim()) {
            console.warn("Attempted to process an empty or non-string link:", originalLink);
            return '#';
        }

        const searchTerm = encodeURIComponent(giftName || '');

        try {
            const url = new URL(originalLink);
            const hostname = url.hostname;

            const amazonDomains = [
                'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de',
                'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.co.jp',
                'amazon.com.au', 'amazon.in'
            ];

            if (amazonDomains.some(domain => hostname.includes(domain))) {
                const searchBaseUrl = `https://${hostname}/s?k=`;
                return `${searchBaseUrl}${searchTerm}&tag=${AMAZON_ASSOCIATE_TAG}`;
            } else if (hostname.includes('etsy.com')) {
                return `https://www.etsy.com/search?q=${searchTerm}`;
            } else if (hostname.includes('target.com')) {
                return `https://www.target.com/s?searchTerm=${searchTerm}`;
            } else if (hostname.includes('bestbuy.com')) {
                return `https://www.bestbuy.com/site/searchpage.jsp?st=${searchTerm}`;
            } else {
                return originalLink;
            }
        } catch (e) {
            console.error("Invalid URL encountered during link processing:", originalLink, e);
            return '#';
        }
    }, [AMAZON_ASSOCIATE_TAG]);

    /**
     * Common API call logic for fetching data.
     * @param {string} prompt - The text prompt for the API.
     * @param {object} schema - The JSON schema for the response.
     * @param {string} mimeType - The expected response MIME type.
     * @returns {Promise<any>} The parsed JSON or text result.
     */
    const callGeminiApi = useCallback(async (prompt, schema = null, mimeType = "text/plain") => {
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: mimeType,
                ...(schema && { responseSchema: schema })
            }
        };

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // For Vite environment variables
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message || 'Unknown error'}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return mimeType === "application/json" ? JSON.parse(result.candidates[0].content.parts[0].text) : result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("No content received from API.");
        }
    }, []);

    /**
     * Fetches gift suggestions from the Gemini API based on all provided criteria.
     */
    const fetchGiftSuggestions = useCallback(async () => {
        setGiftIdeas([]);
        setError(null);
        setIsLoading(true);

        let priceRangeString = '';
        if (minPrice && maxPrice) priceRangeString = `between $${minPrice} and $${maxPrice}`;
        else if (minPrice) priceRangeString = `above $${minPrice}`;
        else if (maxPrice) priceRangeString = `up to $${maxPrice}`;

        const promptParts = [`I need a gift suggestion for someone.`];
        if (occasion) promptParts.push(`The occasion is ${occasion}.`);
        if (relationship) promptParts.push(`They are my ${relationship}.`);
        if (age) promptParts.push(`They are ${age} years old.`);
        if (gender) promptParts.push(`Their gender is ${gender}.`);
        if (notableEvents) promptParts.push(`Notable events in their life include ${notableEvents}.`);
        if (interests) promptParts.push(`They are interested in ${interests}.`);
        if (priceRangeString) promptParts.push(`The price range should be ${priceRangeString}.`);

        let mainPrompt = promptParts.join(' ');
        mainPrompt += ` Please provide a list of at least 5 varied and diverse gift ideas. For each idea, include its name, a brief description, and a direct purchase link. Prioritize direct product links from major retailers like Amazon, Etsy, Target, Best Buy, or official brand websites. If a direct product link is not feasible, provide a relevant search results page link on a major retailer. Respond in JSON format as an. array of objects, each with 'name', 'description', and 'purchaseLink' fields.`;

        const responseSchema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    description: { type: "STRING" },
                    purchaseLink: { type: "STRING" }
                },
                propertyOrdering: ["name", "description", "purchaseLink"]
            }
        };

        try {
            const parsedJson = await callGeminiApi(mainPrompt, responseSchema, "application/json");
            if (Array.isArray(parsedJson)) {
                const processedGiftIdeas = parsedJson.slice(0, 5).map(gift => ({
                    ...gift,
                    purchaseLink: processRetailerLink(gift.purchaseLink, gift.name)
                }));
                setGiftIdeas(processedGiftIdeas);
                setGiftIdeasHistory(prevHistory => {
                    const newHistory = prevHistory.slice(0, historyIndex + 1);
                    return [...newHistory, processedGiftIdeas];
                });
                setHistoryIndex(prevIndex => prevIndex + 1);
            } else {
                setError("Received unexpected data format from API. Please try again.");
                console.error("API returned non-array JSON:", parsedJson);
            }
        } catch (err) {
            console.error("Error fetching gift suggestions:", err);
            setError(`Failed to fetch gift suggestions: ${err.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [minPrice, maxPrice, occasion, relationship, age, gender, notableEvents, interests, historyIndex, processRetailerLink, callGeminiApi]);

    /**
     * Generates a personalized gift card message using the Gemini API.
     */
    const generateCardMessage = useCallback(async () => {
        setCardMessage('');
        setIsGeneratingMessage(true);
        setError(null);

        const messagePromptParts = [`Write a heartfelt and creative gift card message or a short poem.`];
        if (occasion) messagePromptParts.push(`The occasion is ${occasion}.`);
        if (relationship) messagePromptParts.push(`The recipient is my ${relationship}.`);
        if (age) messagePromptParts.push(`They are ${age} years old.`);
        if (gender) messagePromptParts.push(`Their gender is ${gender}.`);
        if (interests) messagePromptParts.push(`They are interested in ${interests}.`);
        if (notableEvents) messagePromptParts.push(`They have been busy with ${notableEvents}.`);

        let fullMessagePrompt = messagePromptParts.join(' ');
        fullMessagePrompt += ` Make sure the message is suitable for the context and tone. Keep it concise, around 50-100 words.`;

        try {
            const message = await callGeminiApi(fullMessagePrompt, null, "text/plain");
            setCardMessage(message);
        } catch (err) {
            console.error("Error generating card message:", err);
            setError(`Failed to generate card message: ${err.message}.`);
            setCardMessage("Error generating message. Please try again.");
        } finally {
            setIsGeneratingMessage(false);
        }
    }, [occasion, relationship, age, gender, interests, notableEvents, callGeminiApi]);

    /**
     * Navigates back in the gift ideas history.
     */
    const goBackInHistory = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGiftIdeas(giftIdeasHistory[newIndex]);
            setError(null);
        }
    }, [historyIndex, giftIdeasHistory]);

    /**
     * Navigates forward in the gift ideas history.
     */
    const goForwardInHistory = useCallback(() => {
        if (historyIndex < giftIdeasHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setGiftIdeas(giftIdeasHistory[newIndex]);
            setError(null);
        }
    }, [historyIndex, giftIdeasHistory]);


    return (
        <div className="min-h-screen bg-white text-black flex flex-col relative overflow-hidden">
            {/* Custom CSS for Avenir font and line-clamp */}
            <style>
                {`
                body {
                    font-family: 'Avenir', 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                /* Custom style for option elements to ensure Avenir font */
                .avenir-font option {
                    font-family: 'Avenir', 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                }
                /* Placeholder color for inputs */
                input::placeholder {
                    color: #9acbdb;
                    opacity: 0.7; /* Adjust as needed for visibility */
                }
                `}
            </style>

            {/* Main Content Area */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4">
                <div className="text-center max-w-4xl w-full">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight">
                        I need {getArticle(occasion)}
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="occasion"
                                value={occasion}
                                onChange={handleOccasionChange}
                                options={['Anniversary', 'Baby Shower', 'Birthday', 'Father\'s Day', 'Graduation', 'Holiday', 'Housewarming', 'Just Because', 'Mother\'s Day', 'Retirement', 'Thank You', 'Valentine\'s']}
                                placeholder="occasion"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-40 md:w-56" // Adjust width for select
                            />
                        </span>
                        gift for my
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="relationship"
                                value={relationship}
                                onChange={handleRelationshipChange}
                                options={['child', 'colleague', 'friend', 'grandparent', 'other', 'parent', 'partner', 'sibling']}
                                placeholder="relationship"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-40 md:w-56" // Adjust width for select
                            />
                        </span>
                        who is
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="age"
                                type="text"
                                value={age}
                                onChange={handleAgeChange}
                                placeholder="age"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-24"
                            />
                        </span>
                        years old.
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="gender"
                                value={gender}
                                onChange={handleGenderChange}
                                options={['He', 'She', 'They']}
                                placeholder="Gender"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-28 md:w-32" // Adjust width for select
                            />
                        </span>
                        {gender === 'they' ? 'are' : 'is'} interested in
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="interests"
                                type="text"
                                value={interests}
                                onChange={handleInterestsChange}
                                placeholder="interests"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-64"
                            />
                        </span>
                        and notable events in <span className="inline-block mx-2">{gender === 'he' ? 'his' : gender === 'she' ? 'her' : 'their'}</span> life include
                        <span className="inline-block mx-2">
                            <DynamicInput
                                id="notableEvents"
                                type="text"
                                value={notableEvents}
                                onChange={handleNotableEventsChange}
                                placeholder="notable events"
                                disabled={isLoading || isGeneratingMessage}
                                extraClasses="w-64"
                            />
                        </span>
                        .
                    </h1>

                    {/* Price Range Inputs */}
                    <div className="flex justify-center items-center gap-4 mt-8 text-xl font-bold">
                        <span className="text-black">Price:</span>
                        <DynamicInput
                            id="minPrice"
                            type="text"
                            value={minPrice ? `$${minPrice}` : ''}
                            onChange={handleMinPriceChange}
                            placeholder="$min"
                            disabled={isLoading || isGeneratingMessage}
                            extraClasses="w-24 text-xl font-bold"
                            textClass="text-[#9acbdb]"
                            borderClass="border-[#477d8f]"
                            focusBorderClass="focus:border-[#2c82c9]"
                        />
                        <span className="text-black">-</span>
                        <DynamicInput
                            id="maxPrice"
                            type="text"
                            value={maxPrice ? `$${maxPrice}` : ''}
                            onChange={handleMaxPriceChange}
                            placeholder="$max"
                            disabled={isLoading || isGeneratingMessage}
                            extraClasses="w-24 text-xl font-bold"
                            textClass="text-[#9acbdb]"
                            borderClass="border-[#477d8f]"
                            focusBorderClass="focus:border-[#2c82c9]"
                        />
                    </div>

                    {/* Combined buttons for Find Gifts, Refresh, and Generate Card Message */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center items-stretch flex-wrap">
                        <ActionButton
                            onClick={fetchGiftSuggestions}
                            disabled={isLoading || isGeneratingMessage || !occasion.trim()}
                            isLoading={isLoading}
                            className="bg-[#2c82c9] text-white hover:bg-opacity-80 hover:text-white focus:ring-[#2c82c9]"
                        >
                            Find Gifts
                        </ActionButton>
                        <ActionButton
                            onClick={fetchGiftSuggestions}
                            disabled={isLoading || isGeneratingMessage || giftIdeas.length === 0 || !occasion.trim()}
                            isLoading={false} // Refresh doesn't have its own loading state, uses main isLoading
                            className="bg-transparent border border-[#2c82c9] text-[#2c82c9] hover:bg-[#2c82c9] hover:text-white focus:ring-[#2c82c9]"
                        >
                            Refresh Gift Ideas
                        </ActionButton>
                        <ActionButton
                            onClick={generateCardMessage}
                            disabled={isGeneratingMessage || isLoading || !occasion.trim()}
                            isLoading={isGeneratingMessage}
                            className="bg-[#ba9bc4] text-white hover:bg-opacity-80 hover:text-white focus:ring-[#ba9bc4]"
                        >
                            ✨ Generate Card Message
                        </ActionButton>
                    </div>

                    {/* History navigation buttons */}
                    <div className="flex justify-center gap-4 mt-4">
                        <ActionButton
                            onClick={goBackInHistory}
                            disabled={historyIndex <= 0 || isLoading || isGeneratingMessage}
                            isLoading={false}
                            className="bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-500"
                        >
                            Back
                        </ActionButton>
                        <ActionButton
                            onClick={goForwardInHistory}
                            disabled={historyIndex >= giftIdeasHistory.length - 1 || isLoading || isGeneratingMessage}
                            isLoading={false}
                            className="bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-500"
                        >
                            Forward
                        </ActionButton>
                    </div>
                </div>
            </main>

            {/* Error and Gift Suggestions Display */}
            {(error || giftIdeas.length > 0 || cardMessage) && (
                <div className="relative z-10 bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-auto my-8">
                    {error && (
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6" role="alert">
                            <p className="font-bold">Error:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {giftIdeas.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-3xl font-semibold text-[#477d8f] mb-4 text-center">Unique Gift Ideas:</h2>
                            <p className="text-sm text-gray-500 mb-4 italic text-center">
                                Please note: Purchase links are AI-generated links and may occasionally be outdated or lead to a general search page. You might need to adjust your search if a link does not work.
                            </p>
                            <ul className="space-y-6">
                                {giftIdeas.map((gift, index) => (
                                    <li key={index} className="bg-gray-50 p-4 rounded-lg shadow-md border border-[#9acbdb]">
                                        <h3 className="text-xl font-semibold text-[#477d8f] mb-2">{gift.name}</h3>
                                        <p className="text-gray-700 mb-2 line-clamp-3">{gift.description}</p>
                                        {gift.purchaseLink && gift.purchaseLink !== '#' && (
                                            <a
                                                href={processRetailerLink(gift.purchaseLink, gift.name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                                            >
                                                Purchase Here
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                                </svg>
                                            </a>
                                        )}
                                        {(!gift.purchaseLink || gift.purchaseLink === '#') && (
                                            <p className="text-sm text-gray-500 mt-2">No direct purchase link available. Try searching online.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {cardMessage && (
                        <div className="mt-8 p-6 bg-[#f5eff7] border border-[#ba9bc4] rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-[#ba9bc4] mb-4 text-center">Your Personalized Card Message:</h2>
                            <p className="text-gray-800 whitespace-pre-wrap text-left">{cardMessage}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;
