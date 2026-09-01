(() => {
    const intro = document.getElementById("weddingIntro");
    const canvas = document.getElementById("inkCanvas");
    const skipButton = document.getElementById("skipButton");
    const context = canvas?.getContext("2d");

    if (!intro || !canvas || !skipButton || !context) {
        return;
    }

    const MESSAGE_DURATION = 2300;
    const EFFECT_DURATION = 2400;
    const DROP_COUNT = 25;
    const INTRO_EXIT_DURATION = 750;
    const LETTERING_REVEAL_PROGRESS = 0.8;
    const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

    let width = 0;
    let height = 0;
    let animationFrame = null;
    let isFinished = false;

    const drops = [];

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    function drawIntroLayer() {
        context.globalCompositeOperation = "source-over";
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#f2eee7";
        context.fillRect(0, 0, width, height);
    }

    function resizeCanvas() {
        const pixelRatio = window.devicePixelRatio || 1;
        const bounds = intro.getBoundingClientRect();

        width = Math.ceil(bounds.width);
        height = Math.ceil(bounds.height);
        canvas.width = Math.ceil(width * pixelRatio);
        canvas.height = Math.ceil(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        drawIntroLayer();
    }

    function createDrops() {
        const minSide = Math.min(width, height);

        drops.length = 0;
        drops.push({
            x: width * 0.5,
            y: height * 0.48,
            startRadius: 2,
            endRadius: minSide * 0.13,
            delay: 0,
            duration: 1800
        });

        for (let index = 1; index < DROP_COUNT; index += 1) {
            drops.push({
                x: random(0, width),
                y: random(0, height),
                startRadius: random(1, 4),
                endRadius: random(
                    minSide * 0.25,
                    minSide * 0.3
                ),
                delay: random(100, 1400),
                duration: random(1400, 2400)
            });
        }
    }

    function eraseDrop(drop, progress) {
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const radius =
            drop.startRadius +
            (drop.endRadius - drop.startRadius) * easedProgress;
        const gradient = context.createRadialGradient(
            drop.x,
            drop.y,
            0,
            drop.x,
            drop.y,
            radius
        );

        context.save();
        context.globalCompositeOperation = "destination-out";

        gradient.addColorStop(0, "rgba(0, 0, 0, 0.75)");
        gradient.addColorStop(0.2, "rgba(0, 0, 0, 0.85)");
        gradient.addColorStop(0.45, "rgba(0, 0, 0, 0.62)");
        gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(drop.x, drop.y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function finishIntro() {
        if (isFinished) {
            return;
        }

        isFinished = true;

        if (animationFrame !== null) {
            window.cancelAnimationFrame(animationFrame);
        }

        intro.classList.add("is-finished");

        const reducedMotion = window.matchMedia(
            REDUCED_MOTION_QUERY
        ).matches;
        const exitDuration = reducedMotion
            ? 200
            : INTRO_EXIT_DURATION;
        const letteringRevealDelay = reducedMotion
            ? 0
            : exitDuration * LETTERING_REVEAL_PROGRESS;

        window.setTimeout(() => {
            window.dispatchEvent(
                new CustomEvent("wedding:intro-reveal")
            );
        }, letteringRevealDelay);

        window.setTimeout(() => {
            intro.remove();
            window.dispatchEvent(
                new CustomEvent("wedding:intro-finished")
            );
        }, exitDuration);
    }

    function startInkEffect() {
        if (isFinished) {
            return;
        }

        intro.classList.add("is-spreading");
        createDrops();

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;

            drops.forEach((drop) => {
                const dropElapsed = elapsed - drop.delay;

                if (dropElapsed < 0) {
                    return;
                }

                eraseDrop(
                    drop,
                    Math.min(dropElapsed / drop.duration, 1)
                );
            });

            if (elapsed < EFFECT_DURATION) {
                animationFrame =
                    window.requestAnimationFrame(animate);
                return;
            }

            context.save();
            context.globalCompositeOperation = "destination-out";
            context.fillStyle = "#000";
            context.fillRect(0, 0, width, height);
            context.restore();

            window.setTimeout(finishIntro, 200);
        };

        animationFrame = window.requestAnimationFrame(animate);
    }

    skipButton.addEventListener("click", (event) => {
        event.stopPropagation();
        finishIntro();
    });
    intro.addEventListener("click", finishIntro);
    window.addEventListener("resize", () => {
        if (!isFinished) {
            resizeCanvas();
        }
    });

    resizeCanvas();
    window.setTimeout(startInkEffect, MESSAGE_DURATION);
})();
