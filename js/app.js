"use strict";

/*
=========================================================
ILMIY PORTFOLIO
Application Controller
=========================================================
*/


/* ========================================================
   DOM
======================================================== */

const adminOpen = document.getElementById("adminOpen");
const adminClose = document.getElementById("adminClose");
const adminDialog = document.getElementById("adminDialog");

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");

const contentForm = document.getElementById("contentForm");
const contentTitle = document.getElementById("contentTitle");
const contentCategory = document.getElementById("contentCategory");
const contentText = document.getElementById("contentText");
const formMessage = document.getElementById("formMessage");

const adminMaterialList = document.getElementById("adminMaterialList");

const materialCount = document.getElementById("materialCount");
const materialCountLabel = document.getElementById("materialCountLabel");

const researchCount = document.getElementById("researchCount");
const teachingCount = document.getElementById("teachingCount");

const researchGrid = document.getElementById("researchGrid");
const teachingGrid = document.getElementById("teachingGrid");

const materialDialog = document.getElementById("materialDialog");
const materialClose = document.getElementById("materialClose");

const detailCategory = document.getElementById("detailCategory");
const detailTitle = document.getElementById("detailTitle");
const detailBody = document.getElementById("detailBody");


/* ========================================================
   SUPABASE
======================================================== */

let supabaseClient = null;

const SUPABASE_URL =
    window.SUPABASE_URL || "";

const SUPABASE_KEY =
    window.SUPABASE_PUBLISHABLE_KEY || "";


function initializeSupabase() {

    if (
        !SUPABASE_URL ||
        !SUPABASE_KEY
    ) {
        console.error(
            "Supabase konfiguratsiyasi topilmadi."
        );

        return false;
    }

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        console.error(
            "Supabase JavaScript kutubxonasi yuklanmagan."
        );

        return false;
    }

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    return true;
}


initializeSupabase();


/* ========================================================
   STATE
======================================================== */

let materials = [];


/* ========================================================
   HELPERS
======================================================== */

function setLoginMessage(
    message,
    type = ""
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.dataset.type = type;
}


function setFormMessage(
    message
) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;
}


function escapeText(value) {

    return String(value ?? "");
}


function makeElement(
    tag,
    className = "",
    text = ""
) {

    const element =
        document.createElement(tag);

    if (className) {
        element.className =
            className;
    }

    if (text !== undefined) {
        element.textContent =
            text;
    }

    return element;
}


/* ========================================================
   SUPABASE AUTH
======================================================== */

async function getCurrentUser() {

    if (!supabaseClient) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();

    if (error) {
        return null;
    }

    return data?.user || null;
}


async function checkAuthentication() {

    const user =
        await getCurrentUser();

    if (user) {

        showDashboard();

        await loadMaterials();

    } else {

        showLogin();

    }
}


/* ========================================================
   LOGIN
======================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!supabaseClient) {

                setLoginMessage(
                    "Supabase ulanmagan. Konfiguratsiyani tekshiring.",
                    "error"
                );

                return;
            }


            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;


            if (!email || !password) {

                setLoginMessage(
                    "Email va parolni kiriting.",
                    "error"
                );

                return;
            }


            setLoginMessage(
                "Tekshirilmoqda..."
            );


            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });


            if (error) {

                console.error(
                    "Login xatosi:",
                    error
                );

                setLoginMessage(
                    "Email yoki parol noto‘g‘ri.",
                    "error"
                );

                return;
            }


            if (!data?.user) {

                setLoginMessage(
                    "Administrator aniqlanmadi.",
                    "error"
                );

                return;
            }


            loginForm.reset();

            setLoginMessage("");

            showDashboard();

            await loadMaterials();

        }
    );

}


/* ========================================================
   LOGOUT
======================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            if (!supabaseClient) {
                return;
            }

            await supabaseClient.auth.signOut();

            materials = [];

            renderAll();

            showLogin();

            setLoginMessage(
                "Administrator hisobidan chiqildi."
            );

        }
    );

}


/* ========================================================
   LOGIN / DASHBOARD UI
======================================================== */

function showLogin() {

    if (loginSection) {
        loginSection.hidden = false;
    }

    if (dashboardSection) {
        dashboardSection.hidden = true;
    }
}


function showDashboard() {

    if (loginSection) {
        loginSection.hidden = true;
    }

    if (dashboardSection) {
        dashboardSection.hidden = false;
    }
}


/* ========================================================
   OPEN ADMIN
======================================================== */

if (adminOpen) {

    adminOpen.addEventListener(
        "click",
        async () => {

            if (!adminDialog) {

                console.error(
                    "adminDialog topilmadi."
                );

                return;
            }


            if (!adminDialog.open) {

                adminDialog.showModal();

            }


            await checkAuthentication();

        }
    );

}


/* ========================================================
   CLOSE ADMIN
======================================================== */

if (adminClose) {

    adminClose.addEventListener(
        "click",
        () => {

            if (adminDialog) {
                adminDialog.close();
            }

        }
    );

}


if (adminDialog) {

    adminDialog.addEventListener(
        "click",
        (event) => {

            if (
                event.target === adminDialog
            ) {

                adminDialog.close();

            }

        }
    );

}


/* ========================================================
   LOAD MATERIALS
======================================================== */

async function loadMaterials() {

    if (!supabaseClient) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("portfolio_materials")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Materiallarni yuklashda xato:",
            error
        );

        materials = [];

        renderAll();

        return;
    }


    materials =
        Array.isArray(data)
            ? data
            : [];


    renderAll();

}


/* ========================================================
   SAVE MATERIAL
======================================================== */

if (contentForm) {

    contentForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const user =
                await getCurrentUser();


            if (!user) {

                setFormMessage(
                    "Avval administrator sifatida kiring."
                );

                showLogin();

                return;
            }


            const title =
                contentTitle.value.trim();

            const category =
                contentCategory.value;

            const body =
                contentText.value.trim();


            if (!title || !body) {

                setFormMessage(
                    "Sarlavha va matnni to‘ldiring."
                );

                return;
            }


            setFormMessage(
                "Material bazaga saqlanmoqda..."
            );


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("portfolio_materials")
                    .insert([
                        {
                            title,
                            category,
                            body,
                        }
                    ])
                    .select()
                    .single();


            if (error) {

                console.error(
                    "Materialni saqlash xatosi:",
                    error
                );

                setFormMessage(
                    "Saqlashda xatolik yuz berdi."
                );

                return;
            }


            materials.unshift(data);

            contentForm.reset();

            setFormMessage(
                "Material muvaffaqiyatli saqlandi."
            );

            renderAll();

        }
    );

}


/* ========================================================
   DELETE MATERIAL
======================================================== */

async function deleteMaterial(
    id
) {

    if (!supabaseClient) {
        return;
    }


    const user =
        await getCurrentUser();


    if (!user) {

        setFormMessage(
            "Admin sessiyasi tugagan."
        );

        return;
    }


    const material =
        materials.find(
            item => item.id === id
        );


    if (!material) {
        return;
    }


    const confirmed =
        window.confirm(
            `"${material.title}" materialini o‘chirasizmi?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("portfolio_materials")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "O‘chirish xatosi:",
            error
        );

        setFormMessage(
            "Materialni o‘chirib bo‘lmadi."
        );

        return;
    }


    materials =
        materials.filter(
            item => item.id !== id
        );


    setFormMessage(
        "Material o‘chirildi."
    );


    renderAll();

}


/* ========================================================
   PUBLIC RESEARCH CARD
======================================================== */

function createResearchCard(
    material,
    index
) {

    const card =
        makeElement(
            "article",
            "research-card dynamic-card"
        );


    const top =
        makeElement(
            "div",
            "research-card-top"
        );


    top.appendChild(
        makeElement(
            "span",
            "",
            `RESEARCH / ${String(index + 1).padStart(3, "0")}`
        )
    );


    top.appendChild(
        makeElement(
            "span",
            "",
            material.category
        )
    );


    card.appendChild(top);


    card.appendChild(
        makeElement(
            "div",
            "research-icon",
            "Σ"
        )
    );


    card.appendChild(
        makeElement(
            "h3",
            "",
            escapeText(material.title)
        )
    );


    const text =
        makeElement(
            "p",
            "",
            escapeText(material.body)
        );


    card.appendChild(text);


    const footer =
        makeElement(
            "div",
            "card-footer"
        );


    footer.appendChild(
        makeElement(
            "span",
            "",
            "SCIENTIFIC MATERIAL"
        )
    );


    const open =
        makeElement(
            "button",
            "card-open-button",
            "↗"
        );


    open.type = "button";


    open.addEventListener(
        "click",
        () => {

            openMaterial(
                material
            );

        }
    );


    footer.appendChild(open);

    card.appendChild(footer);


    return card;

}


/* ========================================================
   PUBLIC TEACHING CARD
======================================================== */

function createTeachingCard(
    material,
    index
) {

    const card =
        makeElement(
            "article",
            "teaching-card dynamic-card"
        );


    const meta =
        makeElement(
            "div",
            "teaching-meta"
        );


    meta.appendChild(
        makeElement(
            "span",
            "",
            `${material.category.toUpperCase()} / ${String(index + 1).padStart(3, "0")}`
        )
    );


    meta.appendChild(
        makeElement(
            "span",
            "",
            "EDUCATION"
        )
    );


    card.appendChild(meta);


    card.appendChild(
        makeElement(
            "h3",
            "",
            escapeText(material.title)
        )
    );


    card.appendChild(
        makeElement(
            "p",
            "",
            escapeText(material.body)
        )
    );


    const bottom =
        makeElement(
            "div",
            "teaching-bottom"
        );


    bottom.appendChild(
        makeElement(
            "span",
            "",
            "EDUCATIONAL MATERIAL"
        )
    );


    const button =
        makeElement(
            "button",
            "read-button",
            "TO‘LIQ O‘QISH ↗"
        );


    button.type = "button";


    button.addEventListener(
        "click",
        () => {

            openMaterial(
                material
            );

        }
    );


    bottom.appendChild(button);

    card.appendChild(bottom);


    return card;

}


/* ========================================================
   RENDER PUBLIC
======================================================== */

function renderPublicMaterials() {

    if (!researchGrid || !teachingGrid) {
        return;
    }


    researchGrid
        .querySelectorAll(".dynamic-card")
        .forEach(
            element =>
                element.remove()
        );


    teachingGrid.replaceChildren();


    const researchCategories = [
        "Ilmiy tadqiqot",
        "Ilmiy maqola",
        "Ekonometrik tahlil",
        "Ilmiy loyiha"
    ];

    const researchMaterials =
        materials.filter(
            item =>
                researchCategories.includes(item.category)
        );

    const teachingMaterials =
        materials.filter(
            item =>
                !researchCategories.includes(item.category)
        );


    researchMaterials.forEach(
        (material, index) => {

            researchGrid.appendChild(
                createResearchCard(
                    material,
                    index + 3
                )
            );

        }
    );


    teachingMaterials.forEach(
        (material, index) => {

            teachingGrid.appendChild(
                createTeachingCard(
                    material,
                    index
                )
            );

        }
    );

}


/* ========================================================
   ADMIN MATERIAL LIST
======================================================== */

function renderAdminMaterials() {

    if (!adminMaterialList) {
        return;
    }


    adminMaterialList.replaceChildren();


    if (materials.length === 0) {

        adminMaterialList.appendChild(
            makeElement(
                "p",
                "form-message",
                "Hozircha material yo‘q."
            )
        );

        return;
    }


    materials.forEach(
        material => {

            const item =
                makeElement(
                    "article",
                    "admin-material-item"
                );


            item.appendChild(
                makeElement(
                    "span",
                    "material-category",
                    material.category
                )
            );


            item.appendChild(
                makeElement(
                    "h4",
                    "",
                    escapeText(
                        material.title
                    )
                )
            );


            item.appendChild(
                makeElement(
                    "p",
                    "",
                    escapeText(
                        material.body
                    )
                )
            );


            const deleteButton =
                makeElement(
                    "button",
                    "delete-material",
                    "MATERIALNI O‘CHIRISH"
                );


            deleteButton.type = "button";


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteMaterial(
                        material.id
                    );

                }
            );


            item.appendChild(
                deleteButton
            );


            adminMaterialList.appendChild(
                item
            );

        }
    );

}


/* ========================================================
   STATISTICS
======================================================== */

function renderStatistics() {

    const total =
        materials.length;


    const researchCategories = [
        "Ilmiy tadqiqot",
        "Ilmiy maqola",
        "Ekonometrik tahlil",
        "Ilmiy loyiha"
    ];

    const research =
        materials.filter(
            item =>
                researchCategories.includes(item.category)
        ).length;


    const teaching =
        total - research;


    if (materialCount) {
        materialCount.textContent =
            total;
    }


    if (materialCountLabel) {
        materialCountLabel.textContent =
            `${total} ta`;
    }


    if (researchCount) {
        researchCount.textContent =
            research;
    }


    if (teachingCount) {
        teachingCount.textContent =
            teaching;
    }

}


/* ========================================================
   MATERIAL DETAIL
======================================================== */

function renderScientificBody(container, body) {
    container.replaceChildren();

    const lines = String(body ?? "").replace(/\r\n?/g, "\n").split("\n");

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            continue;
        }

        if (line.startsWith("FORMULA:")) {
            const formula = document.createElement("div");
            formula.className = "scientific-formula";
            formula.textContent = line.slice("FORMULA:".length).trim();
            container.appendChild(formula);
        } else if (line.startsWith("# ")) {
            const heading = document.createElement("h3");
            heading.className = "scientific-subheading";
            heading.textContent = line.slice(2).trim();
            container.appendChild(heading);
        } else {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            container.appendChild(paragraph);
        }
    }
}
function openMaterial(
    material
) {

    if (!materialDialog) {
        return;
    }


    if (detailCategory) {

        detailCategory.textContent =
            `${material.category} / SCIENTIFIC PORTFOLIO`;

    }


    if (detailTitle) {

        detailTitle.textContent =
            escapeText(
                material.title
            );

    }


    if (detailBody) {

        renderScientificBody(
            detailBody,
            material.body
        );

    }


    materialDialog.showModal();

}


if (materialClose) {

    materialClose.addEventListener(
        "click",
        () => {

            materialDialog.close();

        }
    );

}


if (materialDialog) {

    materialDialog.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                materialDialog
            ) {

                materialDialog.close();

            }

        }
    );

}


/* ========================================================
   RENDER ALL
======================================================== */

function renderAll() {

    renderPublicMaterials();

    renderAdminMaterials();

    renderStatistics();

}


/* ========================================================
   AUTH STATE LISTENER
======================================================== */

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            if (session?.user) {

                showDashboard();

            } else {

                showLogin();

            }

        }
    );

}


/* ========================================================
   INITIAL
======================================================== */

renderAll();

if (supabaseClient) {
    loadMaterials().catch(error => {
        console.error("Ommaviy ma'ruzalarni yuklashda xato:", error);
    });
}

console.log(
    "ILMIY PORTFOLIO — system initialized."
);






/* =========================================================
   INTERACTIVE LINEAR REGRESSION CALCULATOR
========================================================= */

(function initializeRegressionCalculator() {
    const inputA = document.getElementById("regressionA");
    const inputB = document.getElementById("regressionB");
    const inputX = document.getElementById("regressionX");
    const calculateButton = document.getElementById("calculateRegression");
    const resultOutput = document.getElementById("regressionY");
    const explanation = document.getElementById("regressionExplanation");

    if (
        !inputA ||
        !inputB ||
        !inputX ||
        !calculateButton ||
        !resultOutput ||
        !explanation
    ) {
        return;
    }

    const formatNumber = value =>
        new Intl.NumberFormat("uz-UZ", {
            maximumFractionDigits: 8
        }).format(value);

    function calculateRegression() {
        const aText = inputA.value.trim();
        const bText = inputB.value.trim();
        const xText = inputX.value.trim();

        if (aText === "" || bText === "" || xText === "") {
            resultOutput.textContent = "—";
            explanation.textContent = "Iltimos, barcha qiymatlarni kiriting.";
            return;
        }

        const a = Number(aText);
        const b = Number(bText);
        const x = Number(xText);

        if (![a, b, x].every(Number.isFinite)) {
            resultOutput.textContent = "—";
            explanation.textContent = "Faqat haqiqiy sonlarni kiriting.";
            return;
        }

        const y = a + b * x;

        if (!Number.isFinite(y)) {
            resultOutput.textContent = "—";
            explanation.textContent = "Natija sonli diapazondan tashqarida.";
            return;
        }

        resultOutput.textContent = formatNumber(y);
        explanation.textContent =
            `Y = ${formatNumber(a)} + (${formatNumber(b)} × ${formatNumber(x)}) = ${formatNumber(y)}`;
    }

    calculateButton.addEventListener("click", calculateRegression);

    [inputA, inputB, inputX].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                calculateRegression();
            }
        });

        input.addEventListener("input", calculateRegression);
    });

    calculateRegression();
})();


// =========================================================
// OLS ECONOMETRICS ANALYSIS
// Simple linear regression, Pearson r, R-squared, forecast
// =========================================================

(function initializeOlsAnalysis() {
    const dataInput = document.getElementById("olsData");
    const forecastInput = document.getElementById("olsForecastX");
    const runButton = document.getElementById("runOlsAnalysis");
    const errorBox = document.getElementById("olsError");
    const resultsBox = document.getElementById("olsResults");

    if (!dataInput || !forecastInput || !runButton || !errorBox || !resultsBox) {
        return;
    }

    const fields = {
        a: document.getElementById("olsA"),
        b: document.getElementById("olsB"),
        r: document.getElementById("olsR"),
        r2: document.getElementById("olsR2"),
        r2Percent: document.getElementById("olsR2Percent"),
        equation: document.getElementById("olsEquation"),
        forecastY: document.getElementById("olsForecastY"),
        forecastExplanation: document.getElementById("olsForecastExplanation"),
        count: document.getElementById("olsObservationCount")
    };

    if (Object.values(fields).some(element => !element)) return;

    const fmt = value => new Intl.NumberFormat("uz-UZ", {
        maximumFractionDigits: 6
    }).format(value);

    // OLS SVG CHART AND CSV EXPORT
    const chartBox = document.getElementById("olsChart");
    const exportButton = document.getElementById("exportOlsCsv");
    let latestAnalysis = null;

    function drawOlsChart(rows, intercept, slope) {
        if (!chartBox) return;

        const ns = "http://www.w3.org/2000/svg";
        const width = 720;
        const height = 340;
        const pad = { left: 64, right: 24, top: 24, bottom: 52 };

        const minX = Math.min(...rows.map(p => p.x));
        const maxX = Math.max(...rows.map(p => p.x));
        const minY = Math.min(...rows.map(p => p.y));
        const maxY = Math.max(...rows.map(p => p.y));

        const predicted = [intercept + slope * minX, intercept + slope * maxX];
        const yLow = Math.min(minY, maxY, ...predicted);
        const yHigh = Math.max(minY, maxY, ...predicted);

        const xSpan = maxX - minX || 1;
        const ySpan = yHigh - yLow || 1;
        const xMin = minX - xSpan * 0.08;
        const xMax = maxX + xSpan * 0.08;
        const yMin = yLow - ySpan * 0.12;
        const yMax = yHigh + ySpan * 0.12;

        const plotW = width - pad.left - pad.right;
        const plotH = height - pad.top - pad.bottom;
        const sx = x => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
        const sy = y => pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "OLS regressiya grafigi");
        svg.setAttribute("style", "width:100%;height:auto;display:block;");

        function add(tag, attrs, text) {
            const el = document.createElementNS(ns, tag);
            Object.entries(attrs || {}).forEach(([key, value]) => {
                el.setAttribute(key, String(value));
            });
            if (text !== undefined) el.textContent = text;
            svg.appendChild(el);
            return el;
        }

        add("rect", {
            x: 0, y: 0, width, height,
            rx: 12, fill: "#101010", stroke: "#454545"
        });

        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (plotH * i / 4);
            const value = yMax - ((yMax - yMin) * i / 4);

            add("line", {
                x1: pad.left, y1: y, x2: width - pad.right, y2: y,
                stroke: "#383838", "stroke-width": 1
            });

            add("text", {
                x: pad.left - 10, y: y + 4,
                fill: "#c7c7c7", "font-size": 11,
                "text-anchor": "end"
            }, Number(value.toPrecision(5)).toString());
        }

        for (let i = 0; i <= 4; i++) {
            const x = pad.left + (plotW * i / 4);
            const value = xMin + ((xMax - xMin) * i / 4);

            add("line", {
                x1: x, y1: pad.top, x2: x, y2: pad.top + plotH,
                stroke: "#292929", "stroke-width": 1
            });

            add("text", {
                x, y: height - pad.bottom + 22,
                fill: "#c7c7c7", "font-size": 11,
                "text-anchor": "middle"
            }, Number(value.toPrecision(5)).toString());
        }

        add("line", {
            x1: pad.left, y1: pad.top + plotH,
            x2: width - pad.right, y2: pad.top + plotH,
            stroke: "#bdbdbd", "stroke-width": 1.5
        });

        add("line", {
            x1: pad.left, y1: pad.top,
            x2: pad.left, y2: pad.top + plotH,
            stroke: "#bdbdbd", "stroke-width": 1.5
        });

        add("text", {
            x: width / 2, y: height - 10,
            fill: "#e0bd70", "font-size": 13,
            "text-anchor": "middle"
        }, "X — mustaqil o‘zgaruvchi");

        add("text", {
            x: 18, y: height / 2,
            fill: "#e0bd70", "font-size": 13,
            "text-anchor": "middle",
            transform: "rotate(-90 18 " + (height / 2) + ")"
        }, "Y — bog‘liq o‘zgaruvchi");

        add("line", {
            x1: sx(minX), y1: sy(intercept + slope * minX),
            x2: sx(maxX), y2: sy(intercept + slope * maxX),
            stroke: "#e0bd70", "stroke-width": 3,
            "stroke-linecap": "round"
        });

        rows.forEach(point => {
            add("circle", {
                cx: sx(point.x), cy: sy(point.y), r: 5,
                fill: "#f3f3f3", stroke: "#e0bd70",
                "stroke-width": 1.5
            });
        });

        chartBox.replaceChildren(svg);
    }

    function exportOlsCsv() {
        if (!latestAnalysis) {
            if (errorBox) {
                errorBox.textContent = "Avval OLS hisoblash tugmasini bosing.";
            }
            return;
        }

        const data = latestAnalysis;
        const esc = value => String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        const textCell = value =>
            '<Cell><Data ss:Type="String">' + esc(value) + '</Data></Cell>';

        const numberCell = value => {
            const n = Number(value);
            return '<Cell><Data ss:Type="Number">' +
                (Number.isFinite(n) ? String(n) : "0") +
                '</Data></Cell>';
        };

        const row = cells => "<Row>" + cells.join("") + "</Row>";

        const summary = [
            row([textCell("Bo‘lim"), textCell("Ko‘rsatkich"), textCell("Qiymat")]),
            row([textCell("Model"), textCell("Intercept (a)"), numberCell(data.a)]),
            row([textCell("Model"), textCell("Slope (b)"), numberCell(data.b)]),
            row([textCell("Model"), textCell("Pearson r"), numberCell(data.r)]),
            row([textCell("Model"), textCell("R-squared"), numberCell(data.r2)]),
            row([textCell("Prognoz"), textCell("X"), numberCell(data.forecastX)]),
            row([textCell("Prognoz"), textCell("Y prognoz"), numberCell(data.forecastY)]),
            row([]),
            row([
                textCell("Kuzatuv"),
                textCell("X"),
                textCell("Y"),
                textCell("Hisoblangan Y"),
                textCell("Qoldiq (Y - Ŷ)")
            ])
        ];

        data.rows.forEach((point, index) => {
            const fitted = data.a + data.b * point.x;
            const residual = point.y - fitted;

            summary.push(row([
                numberCell(index + 1),
                numberCell(point.x),
                numberCell(point.y),
                numberCell(fitted),
                numberCell(Math.abs(residual) < 1e-12 ? 0 : residual)
            ]));
        });

        const xml =
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<?mso-application progid="Excel.Sheet"?>' +
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
            'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
            '<Worksheet ss:Name="OLS natijalari"><Table>' +
            summary.join("") +
            '</Table></Worksheet></Workbook>';

        const blob = new Blob(["\uFEFF", xml], {
            type: "application/vnd.ms-excel;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "ols-regressiya-natijalari.xls";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    if (exportButton) {
        exportButton.addEventListener("click", exportOlsCsv);
    }
    function analyze() {
        errorBox.textContent = "";
        resultsBox.hidden = true;

        const raw = dataInput.value.trim();
        const forecastText = forecastInput.value.trim();

        if (!raw || !forecastText) {
            errorBox.textContent = "Kuzatuvlar va prognoz uchun X qiymatini kiriting.";
            return;
        }

        const rows = raw.split(/\r?\n/).map((line, index) => {
            const parts = line.trim().split(/[;, \t]+/).filter(Boolean);

            if (parts.length !== 2) {
                throw new Error(`${index + 1}-qator: X va Y qiymatlarini kiriting (masalan, 2,5).`);
            }

            const x = Number(parts[0]);
            const y = Number(parts[1]);

            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                throw new Error(`${index + 1}-qator: qiymatlar son bo‘lishi kerak.`);
            }

            return { x, y };
        });

        if (rows.length < 3) {
            throw new Error("Ishonchli tekshiruv uchun kamida 3 ta kuzatuv kiriting.");
        }

        const forecastX = Number(forecastText);
        if (!Number.isFinite(forecastX)) {
            throw new Error("Prognoz X qiymati to‘g‘ri son bo‘lishi kerak.");
        }

        const n = rows.length;
        const meanX = rows.reduce((sum, row) => sum + row.x, 0) / n;
        const meanY = rows.reduce((sum, row) => sum + row.y, 0) / n;

        let sxx = 0;
        let syy = 0;
        let sxy = 0;

        for (const row of rows) {
            const dx = row.x - meanX;
            const dy = row.y - meanY;
            sxx += dx * dx;
            syy += dy * dy;
            sxy += dx * dy;
        }

        if (sxx === 0) {
            throw new Error("Barcha X qiymatlari bir xil. Regressiya hisoblab bo‘lmaydi.");
        }

        if (syy === 0) {
            throw new Error("Barcha Y qiymatlari bir xil. Pearson r aniqlanmaydi.");
        }

        const b = sxy / sxx;
        const a = meanY - b * meanX;
        const r = sxy / Math.sqrt(sxx * syy);
        const r2 = (sxy * sxy) / (sxx * syy);
        const forecastY = a + b * forecastX;

        if (![a, b, r, r2, forecastY].every(Number.isFinite)) {
            throw new Error("Hisoblashda sonli xatolik yuz berdi. Ma’lumotlarni tekshiring.");
        }

        fields.a.textContent = fmt(a);
        fields.b.textContent = fmt(b);
        fields.r.textContent = fmt(r);
        fields.r2.textContent = fmt(r2);
        fields.r2Percent.textContent = `R² × 100 = ${fmt(r2 * 100)}%`;
        fields.equation.textContent = `Ŷ = ${fmt(a)} ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b))}X`;
        fields.forecastY.textContent = fmt(forecastY);
        fields.forecastExplanation.textContent =
            `X = ${fmt(forecastX)} uchun: Ŷ = ${fmt(a)} + (${fmt(b)} × ${fmt(forecastX)})`;
        fields.count.textContent = `Kuzatuvlar soni: ${n}. Hisoblash usuli: eng kichik kvadratlar (OLS).`;

        // OLS RESIDUAL DIAGNOSTICS
        function renderResidualDiagnostics(rows, intercept, slope) {
            const maeBox = document.getElementById("olsMae");
            const rmseBox = document.getElementById("olsRmse");
            const dwBox = document.getElementById("olsDw");
            const noteBox = document.getElementById("olsDwNote");
            const chart = document.getElementById("olsResidualChart");

            if (!maeBox || !rmseBox || !dwBox || !chart) return;

            const residuals = rows.map(point =>
                point.y - (intercept + slope * point.x)
            );

            const mae = residuals.reduce((sum, e) => sum + Math.abs(e), 0)
                / residuals.length;

            const rmse = Math.sqrt(
                residuals.reduce((sum, e) => sum + e * e, 0)
                / residuals.length
            );

            const totalSquares = residuals.reduce((sum, e) => sum + e * e, 0);

            let differenceSquares = 0;
            for (let i = 1; i < residuals.length; i++) {
                const difference = residuals[i] - residuals[i - 1];
                differenceSquares += difference * difference;
            }

            const dw = totalSquares > 0
                ? differenceSquares / totalSquares
                : null;

            const fmtDiagnostic = value => new Intl.NumberFormat("uz-UZ", {
                maximumFractionDigits: 6
            }).format(value);

            maeBox.textContent = fmtDiagnostic(mae);
            rmseBox.textContent = fmtDiagnostic(rmse);
            dwBox.textContent = dw === null ? "Aniqlanmaydi" : fmtDiagnostic(dw);

            if (noteBox) {
                noteBox.textContent = dw === null
                    ? "Barcha qoldiqlar nolga teng. DW ko‘rsatkichi aniqlanmaydi."
                    : "DW = " + fmtDiagnostic(dw) +
                      ". Talqin kuzatuvlar soni, model va statistik test shartlariga bog‘liq; bu qiymatning o‘zi xulosa uchun yetarli emas.";
            }

            // BREUSCH_PAGAN_DIAGNOSTICS
const bpLmBox = document.getElementById("olsBpLm");
const bpPBox = document.getElementById("olsBpP");
const bpNoteBox = document.getElementById("olsBpNote");

if (bpLmBox && bpPBox && bpNoteBox) {
    const n = rows.length;
    const squaredResiduals = residuals.map(e => e * e);

    const meanX = rows.reduce((s, p) => s + p.x, 0) / n;
    const meanZ = squaredResiduals.reduce((s, z) => s + z, 0) / n;

    let sxx = 0;
    let szz = 0;
    let sxz = 0;

    for (let i = 0; i < n; i++) {
        const dx = rows[i].x - meanX;
        const dz = squaredResiduals[i] - meanZ;
        sxx += dx * dx;
        szz += dz * dz;
        sxz += dx * dz;
    }

    const fmtBP = value => new Intl.NumberFormat("uz-UZ", {
        maximumFractionDigits: 6
    }).format(value);

    if (n <= 2 || sxx <= 0 || szz <= 1e-24) {
        bpLmBox.textContent = "Aniqlanmaydi";
        bpPBox.textContent = "Aniqlanmaydi";
        bpNoteBox.textContent =
            "BP testi uchun kuzatuvlar yetarli emas yoki yordamchi regressiyada o'zgaruvchanlik mavjud emas.";
    } else {
        const bpR2 = Math.max(0, Math.min(1, (sxz * sxz) / (sxx * szz)));
        const bpLM = n * bpR2;

        // Chi-square survival probability for df=1:
        // P(Chi-square(1) >= LM) = erfc(sqrt(LM / 2)).
        // Numerical approximation from Abramowitz–Stegun 7.1.26.
        const erfcApprox = x => {
            const z = Math.abs(x);
            const t = 1 / (1 + 0.5 * z);
            const ans = t * Math.exp(
                -z * z - 1.26551223 +
                t * (1.00002368 +
                t * (0.37409196 +
                t * (0.09678418 +
                t * (-0.18628806 +
                t * (0.27886807 +
                t * (-1.13520398 +
                t * (1.48851587 +
                t * (-0.82215223 +
                t * 0.17087277))))))))
            );
            return x >= 0 ? ans : 2 - ans;
        };

        const bpP = Math.max(0, Math.min(1, erfcApprox(Math.sqrt(bpLM / 2))));

        bpLmBox.textContent = fmtBP(bpLM);
        bpPBox.textContent = fmtBP(bpP);

        if (bpP < 0.05) {
            bpNoteBox.textContent =
                "5% darajada H₀ rad etiladi: geteroskedastiklik mavjudligiga statistik dalil bor. Kichik tanlanmada natija ehtiyotkorlik bilan talqin qilinadi.";
        } else {
            bpNoteBox.textContent =
                "5% darajada H₀ rad etilmaydi: geteroskedastiklik mavjudligi uchun yetarli statistik dalil topilmadi. Bu dispersiya mutlaqo doimiyligini isbotlamaydi.";
        }

        if (n < 30) {
            bpNoteBox.textContent +=
                " Kuzatuvlar soni kichik (n = " + n +
                "); BP testining asimptotik p-value qiymati ishonchsiz bo'lishi mumkin.";
        }
    }
}
const ns = "http://www.w3.org/2000/svg";
            const width = 720;
            const height = 280;
            const pad = { left: 58, right: 20, top: 22, bottom: 42 };
            const values = rows.map((point, i) => ({
                x: point.x,
                residual: residuals[i]
            }));

            const minX = Math.min(...values.map(p => p.x));
            const maxX = Math.max(...values.map(p => p.x));
            const absMax = Math.max(...values.map(p => Math.abs(p.residual)), 1e-8) * 1.15;
            const xSpan = maxX - minX || 1;
            const plotW = width - pad.left - pad.right;
            const plotH = height - pad.top - pad.bottom;
            const sx = x => pad.left + ((x - minX) / xSpan) * plotW;
            const sy = y => pad.top + ((absMax - y) / (2 * absMax)) * plotH;

            const svg = document.createElementNS(ns, "svg");
            svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            svg.setAttribute("role", "img");
            svg.setAttribute("aria-label", "OLS qoldiqlar grafigi");
            svg.setAttribute("style", "width:100%;height:auto;display:block");

            function add(tag, attrs, text) {
                const el = document.createElementNS(ns, tag);
                Object.entries(attrs).forEach(([key, value]) =>
                    el.setAttribute(key, String(value))
                );
                if (text !== undefined) el.textContent = text;
                svg.appendChild(el);
                return el;
            }

            add("rect", {
                x: 0, y: 0, width, height, rx: 10,
                fill: "#101010", stroke: "#454545"
            });

            add("line", {
                x1: pad.left, y1: sy(0), x2: width - pad.right, y2: sy(0),
                stroke: "#e0bd70", "stroke-width": 2
            });

            add("text", {
                x: 14, y: 18, fill: "#e0bd70", "font-size": 12
            }, "Qoldiq (e)");

            add("text", {
                x: width / 2, y: height - 9, fill: "#e0bd70",
                "font-size": 12, "text-anchor": "middle"
            }, "X");

            values.forEach(point => {
                add("circle", {
                    cx: sx(point.x), cy: sy(point.residual), r: 5,
                    fill: "#f3f3f3", stroke: "#e0bd70", "stroke-width": 1.5
                });
            });

            chart.replaceChildren(svg);
        }
        latestAnalysis = {
            rows: rows.map(point => ({ x: point.x, y: point.y })),
            a: a,
            b: b,
            r: r,
            r2: r2,
            forecastX: forecastX,
            forecastY: forecastY
        };

        drawOlsChart(rows, a, b);
        renderResidualDiagnostics(rows, a, b);
        resultsBox.hidden = false;
    }

    runButton.addEventListener("click", () => {
        try {
            analyze();
        } catch (error) {
            errorBox.textContent = error.message || "Noma’lum xatolik yuz berdi.";
        }
    });

    dataInput.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            runButton.click();
        }
    });
})();






