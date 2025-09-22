import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(relativeTime)

type PossiblyADate = Date | string | number
export const toUTC = (date: PossiblyADate, format: string) => {
    try {
        return dayjs(date).utc().format(format)
    } catch {
        return 'Not a date'
    }
}

export const DAYJS_FORMATS = {
    dateLong: (date: PossiblyADate) => `${toUTC(date, 'dddd, MMMM D, YYYY ∙ hh:mm A')} UTC`,
    date: (date: PossiblyADate) => toUTC(date, 'ddd. MMM. D ∙ hh:mm A'),
    dateShort: (date: PossiblyADate) => toUTC(date, 'MMM. D ∙ hh:mm A'),
    dateChart: (date: PossiblyADate) => toUTC(date, 'MMM. D'),
    dateTimeChart: (date: PossiblyADate) => `${toUTC(date, 'hh:mm:ss')} UTC`,
    custom: (date: PossiblyADate, format: string) => toUTC(date, format),
    timeAgo: (date: PossiblyADate) => dayjs(date).utc().fromNow(),
}

export const getDurationBetween = ({
    startTs,
    endTs,
    showYears = true,
    showMonths = true,
    showWeeks = true,
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    shortFormat = true,
    ago = true,
}: {
    startTs: number
    endTs: number
    showYears?: boolean
    showMonths?: boolean
    showWeeks?: boolean
    showDays?: boolean
    showHours?: boolean
    showMinutes?: boolean
    showSeconds?: boolean
    shortFormat?: boolean
    ago?: boolean
}): {
    // details
    inSeconds: number
    inMinutes: number
    inHours: number
    inDays: number
    inWeeks: number
    inMonths: number
    inYears: number

    // format
    oneLiner: string
    humanize: string
} => {
    // get details
    const diffInMilliseconds = dayjs(endTs).diff(startTs)
    const diffDuration = dayjs.duration(diffInMilliseconds)
    const inSeconds = Math.floor(diffDuration.asSeconds()) % 60
    const inMinutes = Math.floor(diffDuration.asMinutes()) % 60
    const inHours = Math.floor(diffDuration.asHours()) % 24
    const inDays = Math.floor(diffDuration.asDays()) % 7
    const inWeeks = Math.floor(diffDuration.asWeeks()) % 52
    const inMonths = Math.floor(diffDuration.asMonths()) % 12
    const inYears = Math.floor(diffDuration.asYears())

    // short format
    const year = shortFormat ? 'y' : 'year'
    const month = shortFormat ? 'M' : 'month'
    const week = shortFormat ? 'w' : 'week'
    const day = shortFormat ? 'd' : 'day'
    const hour = shortFormat ? 'h' : 'hour'
    const minute = shortFormat ? 'm' : 'minute'
    const second = shortFormat ? 's' : 'second'
    const space = shortFormat ? '' : ' '

    // format
    let oneLiner = ''
    if (showYears && inYears) oneLiner += `${inYears}${space}${year}${!shortFormat && inYears > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showMonths && inMonths) oneLiner += `${inMonths}${space}${month}${!shortFormat && inMonths > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showWeeks && inWeeks) oneLiner += `${inWeeks}${space}${week}${!shortFormat && inWeeks > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showDays && inDays) oneLiner += `${inDays}${space}${day}${!shortFormat && inDays > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showHours && inHours) oneLiner += `${inHours}${space}${hour}${!shortFormat && inHours > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showMinutes && inMinutes) oneLiner += `${inMinutes}${space}${minute}${!shortFormat && inMinutes > 1 ? 's' : ''}${shortFormat ? '' : ','} `
    if (showSeconds && inSeconds) oneLiner += `${inSeconds}${space}${second}${!shortFormat && inSeconds > 1 ? 's' : ''}${shortFormat ? '' : ','} `

    return {
        // details
        inSeconds,
        inMinutes,
        inHours,
        inDays,
        inWeeks,
        inMonths,
        inYears,

        // format
        // oneLiner: diffInMilliseconds > 0 && oneLiner ? `${oneLiner.slice(0, -2).trim()}${ago ? ' ago' : ''}` : 'now',
        oneLiner: diffInMilliseconds > 0 && oneLiner ? `${oneLiner}${ago ? ' ago' : ''}` : 'now',
        humanize: diffDuration.humanize(),
    }
}
