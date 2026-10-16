// @todo: напишите здесь код парсера

function parsePage() {
    const meta = {
        language: document.documentElement.lang,
        title: document.title.split(' — ')[0].trim(),
        //.split('—')[0].trim() — отделяет название страницы от названия сайта
        description: document.querySelector('meta[name="description"]').content,
        keywords: document.querySelector('meta[name="keywords"]')
            .content.split(',').map((word) => word.trim()),
        //.content — получает содержимое метатега, .split(',') — превращает строку ключевых слов в массив, .map() — очищает каждое слово от пробелов
        opengraph: {}
        //создаём пустой объект
    };

    document.querySelectorAll('meta[property^="og:"]').forEach((tag) => {
        const key = tag.getAttribute('property').replace('og:', '');
        meta.opengraph[key] = tag.content.split('—')[0].trim();
        //meta.opengraph[key] = tag.content — добавляем каждый найденный тег в объект
    });

    const productElement = document.querySelector('.product');
    
    const selectedImage = productElement.querySelector('.preview nav button:disabled img');
    //выбранная фотография

    const thumbnailImages = [
        ...productElement.querySelectorAll('.preview nav img')
    ];
    //собирает все пять миниатюр в массив

    const images = [
        {
            preview: selectedImage.src,
            full: selectedImage.dataset.src,
            alt: selectedImage.alt
        },
        ...thumbnailImages
            .filter((img) => img !== selectedImage) //убирает выбранную картинку из списка миниатюр, чтобы она не повторялась
            .map((img) => ({ //превращает каждую оставшуюся картинку в объект с тремя полями:
                preview: img.src, //миниатюра
                full: img.dataset.src, //ссылка на полное изображение, которое указано в dataset
                alt: img.alt //текстовое описание картинки
            }))
    ];

    const tags = [...productElement.querySelectorAll('.tags span')];

    const categories = tags
        .filter((tag) => tag.classList.contains('green'))
        .map((tag) => tag.textContent.trim());

    const labels = tags
        .filter((tag) => tag.classList.contains('blue'))
        .map((tag) => tag.textContent.trim());

    const discounts = tags
        .filter((tag) => tag.classList.contains('red'))
        .map((tag) => tag.textContent.trim());

    const priceElement = productElement.querySelector('.price');

    const currentPriceText = [...priceElement.childNodes]
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    
    const currentPrice = Number(
        currentPriceText.textContent.trim().replace('₽', '')
    );

    const oldPrice = Number(
        priceElement.querySelector('span').textContent.trim().replace('₽', '')
    );
    //аналогично, только для старой цены обращаемся к span, потому что цена находится внутри него

    const discount = oldPrice - currentPrice;

    const discountPercent = `${((discount / oldPrice) * 100).toFixed(2)}%`;
    //toFixed(2) оставляет два знака после запятой

    const properties = {}; //создаём пустой объект

    productElement.querySelectorAll('.properties li').forEach((item) => {
        const spans = item.querySelectorAll('span');

        const key = spans[0].textContent.trim();
        const value = spans[1].textContent.trim();

        properties[key] = value; //записываем пару в объект
    });

    const descriptionElement = productElement.querySelector('.description'); //находим описание товара

    const descriptionClone = descriptionElement.cloneNode(true);
    //cloneNode(true) создаёт его копию вместе со всеми вложенными элементами, оригинал на странице не меняется

    descriptionClone.querySelectorAll('*').forEach((element) => {
    //querySelectorAll('*') находит все вложенные HTML-элементы
        [...element.attributes].forEach((attribute) => {
        //element.attributes содержит атрибуты конкретного элемента
            element.removeAttribute(attribute.name);
            //removeAttribute(attribute.name) удаляет каждый атрибут
        });
    });

    const description = descriptionClone.innerHTML.trim();
    //innerHTML возвращает HTML-разметку внутри элемента, а не просто текст

    function getCurrencyCode(priceText) {
        if (priceText.includes('$')) return 'USD';
        if (priceText.includes('€')) return 'EUR';
        if (priceText.includes('₽')) return 'RUB';
        return null;
    }

    const product = {
        id: productElement.dataset.id,
        //получаем идентификатор товара
        name: document.querySelector('h1').textContent.trim(),
        //получаем название
        isLiked: productElement.querySelector('.like').classList.contains('active'),
        //проверяем cтатус лайка
        images,
        tags: {
            category: categories,
            label: labels,
            discount: discounts
        },
        price: currentPrice,
        oldPrice,
        discount,
        discountPercent,
        currency: getCurrencyCode(currentPriceText.textContent),
        properties,
        description
    };

    const suggested = [...document.querySelectorAll('.suggested .items article')]
    //querySelectorAll('.suggested .items article') - находим все четыре карточки рекомендованных товаров
    //превращая найденные элементы в массив, заключив в [... ] 
        .map((item) => {
        //.map() проходим по каждой карточке и создаём для неё объект
            const image = item.querySelector('img');
            const name = item.querySelector('h3').textContent.trim();
            const priceText = item.querySelector('b').textContent.trim();
            const description = item.querySelector('p').textContent.trim();

            const price = priceText.replace(/[₽$€]/g, '').trim();

            return {
                image: image.src,
                name,
                price,
                currency: getCurrencyCode(priceText),
                description
            };
        });

    const reviews = [...document.querySelectorAll('.reviews .items article')]
        .map((item) => {
            const rating = item.querySelectorAll('.rating .filled').length;
            //rating — считаем количество закрашенных звёздочек (рейтинг)

            const title = item.querySelector('h3').textContent.trim();
            const description = item.querySelector('.author')
                .previousElementSibling.querySelector('p').textContent.trim();
                //у блока .author предыдущий соседний элемент содержит заголовок и текст отзыва, через previousElementSibling мы находим описание

            const authorElement = item.querySelector('.author');
            const avatar = authorElement.querySelector('img').src;
            const name = authorElement.querySelector('span').textContent.trim();

            const dateText = authorElement.querySelector('i').textContent.trim();
            const [day, month, year] = dateText.split('/'); //разбираем дату 00/00/0000 на три части
            const date = `${day}.${month}.${year}`; //собираем дату в нужном формате: 00.00.0000

            return {
                rating,
                title,
                description,
                author: {
                    avatar,
                    name
                },
                date
            };
        });

    return {
        meta,
        product,
        suggested,
        reviews
    };
}

window.parsePage = parsePage;